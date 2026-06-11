import { env } from "@/config/env";
import { AGENT_TOOLS, executeAgentTool } from "@/services/agent-tools";

/**
 * hermes.service — cliente del agente Hermes vía su proxy OpenAI-compatible
 * (`hermes proxy start`, default http://127.0.0.1:8645/v1).
 *
 * Opción A: el backend orquesta el tool-calling. Le pasa al modelo el system
 * prompt + las tools; cuando el modelo pide un `tool_call`, lo ejecutamos
 * contra los services (con `companyId` forzado) y le devolvemos el resultado,
 * repitiendo hasta la respuesta final.
 *
 * Seguridad (RNF1): la API key vive SOLO acá. Con `HERMES_MOCK=true` se usa un
 * stream simulado para trabajar sin el proxy levantado.
 */

/** §12 — onboarding por etapas, una pregunta por turno. */
export const ONBOARDING_PROMPT = `Sos Hermes, asistente de onboarding de un optimizador energético para PyMEs de Tierra del Fuego.
Estás trabajando sobre UNA empresa ya creada (su id es implícito; nunca lo pidas ni lo manejes).
Construís su "gemelo digital" conversando, una etapa a la vez:
identity → equipment → operation → tariffs → complete.

Reglas:
- Una sola pregunta por turno. No avances de etapa sin completar la actual.
- Cuando el usuario te da un dato, GUARDALO con la tool correspondiente:
  · rubro/localidad/tarifas/etapa/% perfil → update_company
  · un equipo (nombre, vector gas/electricidad, potencia, horas/día, días/mes) → add_equipment
  · para repasar lo cargado → list_equipment / profile_status
- Al completar las etapas, llamá project_consumption con la temperatura prevista y mostrá la primera predicción de consumo y costo (el "momento mágico").
Respondé en español, claro y breve.`;

export type HermesEvent =
  | { type: "token"; value: string }
  | { type: "tool"; name: string }
  | { type: "done"; content: string };

export interface StreamParams {
  /** Empresa sobre la que opera el chat; se inyecta en las tools. */
  companyId: string;
  systemPrompt?: string;
  userMessage: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

/** Tope de rondas de tool-calling para evitar loops infinitos. */
const MAX_STEPS = 6;

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export const hermesService = {
  async *stream(params: StreamParams): AsyncGenerator<HermesEvent> {
    if (env.HERMES_MOCK || !env.HERMES_API_KEY) {
      yield* mockStream(params);
      return;
    }
    yield* realStream(params);
  },
};

// ── Loop real con tool-calling sobre el proxy ─────────────────────────────
async function* realStream(params: StreamParams): AsyncGenerator<HermesEvent> {
  const messages: ChatMessage[] = [
    { role: "system", content: params.systemPrompt ?? ONBOARDING_PROMPT },
    ...(params.history ?? []),
    { role: "user", content: params.userMessage },
  ];

  let finalContent = "";

  for (let step = 0; step < MAX_STEPS; step++) {
    const { content, toolCalls, finishReason, events } =
      await streamOneRound(messages);

    // reemitimos los tokens de contenido de esta ronda.
    for (const ev of events) yield ev;
    finalContent = content;

    if (finishReason !== "tool_calls" || toolCalls.length === 0) {
      yield { type: "done", content: finalContent };
      return;
    }

    // El modelo pidió tools: las ejecutamos y realimentamos.
    messages.push({
      role: "assistant",
      content: content || null,
      tool_calls: toolCalls,
    });

    for (const tc of toolCalls) {
      yield { type: "tool", name: tc.function.name };
      let args: unknown = {};
      try {
        args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch {
        /* argumentos inválidos → el executor devolverá el error */
      }
      const result = await executeAgentTool(
        params.companyId,
        tc.function.name,
        args,
      );
      messages.push({ role: "tool", tool_call_id: tc.id, content: result });
    }
  }

  // Se agotó MAX_STEPS sin un cierre limpio.
  yield { type: "done", content: finalContent };
}

/** Hace UNA llamada al modelo (stream) y ensambla contenido + tool_calls. */
async function streamOneRound(messages: ChatMessage[]): Promise<{
  content: string;
  toolCalls: ToolCall[];
  finishReason: string | null;
  events: HermesEvent[];
}> {
  const res = await fetch(`${env.HERMES_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HERMES_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.HERMES_MODEL,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: "auto",
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Hermes proxy respondió ${res.status}: ${detail.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let finishReason: string | null = null;
  const toolAcc = new Map<number, { id: string; name: string; args: string }>();
  const events: HermesEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue; // ignora comentarios (": …")
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      let json: StreamChunk;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      const choice = json.choices?.[0];
      if (!choice) continue;
      const delta = choice.delta;

      if (delta?.content) {
        content += delta.content;
        events.push({ type: "token", value: delta.content });
      }
      for (const tc of delta?.tool_calls ?? []) {
        const slot = toolAcc.get(tc.index) ?? { id: "", name: "", args: "" };
        if (tc.id) slot.id = tc.id;
        if (tc.function?.name) slot.name = tc.function.name;
        if (tc.function?.arguments) slot.args += tc.function.arguments;
        toolAcc.set(tc.index, slot);
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    }
  }

  const toolCalls: ToolCall[] = [...toolAcc.values()].map((t) => ({
    id: t.id,
    type: "function",
    function: { name: t.name, arguments: t.args },
  }));

  return { content, toolCalls, finishReason, events };
}

interface StreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

// ── Mock determinístico (sin proxy) ───────────────────────────────────────
async function* mockStream(params: StreamParams): AsyncGenerator<HermesEvent> {
  const reply =
    `Recibí tu mensaje: "${params.userMessage.slice(0, 80)}". ` +
    `Soy Hermes (modo demo, sin proxy). Para guardar datos de verdad, levantá ` +
    `\`hermes proxy start\` y poné HERMES_MOCK=false. ¿Qué equipo querés cargar?`;
  for (const word of reply.split(" ")) {
    yield { type: "token", value: word + " " };
  }
  yield { type: "done", content: reply };
}
