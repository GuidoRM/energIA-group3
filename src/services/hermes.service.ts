import { env } from "@/config/env";

/**
 * hermes.service — cliente del agente Hermes (API OpenAI-compatible, §10).
 *
 * Seguridad (RNF1): la API key vive SOLO acá, en el backend. El frontend
 * nunca llama a `localhost:8642`.
 *
 * Si `HERMES_MOCK=true` (o no hay gateway), devuelve un stream simulado y
 * determinístico para que el chat funcione en la demo sin Hermes corriendo.
 */

/** §12 — el agente conduce un onboarding por etapas, una pregunta por turno. */
export const ONBOARDING_PROMPT = `Sos Hermes, asistente de onboarding de un optimizador energético para PyMEs de Tierra del Fuego.
Construís el "gemelo digital" de la empresa conversando, una etapa a la vez:
identity → equipment → operation → tariffs → complete.
Reglas:
- Una sola pregunta por turno.
- No avances de etapa sin completar la actual.
- Usá las tools MCP para guardar lo que el usuario te dice (create_company, add_equipment, update_company, project_consumption).
- Al llegar a "complete", llamá project_consumption y mostrá la primera predicción de consumo y costo.
Respondé en español, claro y breve.`;

export type HermesEvent =
  | { type: "token"; value: string }
  | { type: "tool"; name: string }
  | { type: "done"; content: string };

export interface StreamParams {
  /** Nombre del hilo del lado de Hermes, derivado de la empresa. */
  conversation: string;
  systemPrompt?: string;
  userMessage: string;
  /** Historial previo (role/content) para dar contexto. */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export const hermesService = {
  /** Stream de eventos del agente para un mensaje del usuario. */
  async *stream(params: StreamParams): AsyncGenerator<HermesEvent> {
    if (env.HERMES_MOCK || !env.HERMES_API_KEY) {
      yield* mockStream(params);
      return;
    }
    yield* realStream(params);
  },
};

// ── Hermes real (OpenAI-compatible streaming) ─────────────────────────────
async function* realStream(params: StreamParams): AsyncGenerator<HermesEvent> {
  const res = await fetch(`${env.HERMES_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HERMES_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.HERMES_MODEL,
      messages: [
        { role: "system", content: params.systemPrompt ?? ONBOARDING_PROMPT },
        ...(params.history ?? []),
        { role: "user", content: params.userMessage },
      ],
      conversation: params.conversation,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Hermes respondió ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta;
        const toolName = delta?.tool_calls?.[0]?.function?.name;
        if (toolName) yield { type: "tool", name: toolName };
        const token: string | undefined = delta?.content;
        if (token) {
          full += token;
          yield { type: "token", value: token };
        }
      } catch {
        // chunk parcial; se completa en la próxima iteración.
      }
    }
  }

  yield { type: "done", content: full };
}

// ── Mock determinístico (sin gateway) ─────────────────────────────────────
async function* mockStream(params: StreamParams): AsyncGenerator<HermesEvent> {
  const reply =
    `Recibí tu mensaje: "${params.userMessage.slice(0, 80)}". ` +
    `Soy Hermes (modo demo, sin gateway). Sigamos con el onboarding: ` +
    `¿qué equipos consumen energía en tu empresa? Decime uno, con su potencia y horas de uso.`;

  for (const word of reply.split(" ")) {
    yield { type: "token", value: word + " " };
  }
  yield { type: "done", content: reply };
}
