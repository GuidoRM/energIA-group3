import { z } from "zod";

import { formatCurrency, formatNumber, VECTOR_LABEL } from "@/lib/format";
import {
  createEquipmentSchema,
  updateCompanySchema,
} from "@/lib/validation";
import { companyService } from "@/services/company.service";
import { equipmentService } from "@/services/equipment.service";
import { projectionService } from "@/services/projection.service";

/**
 * Tools que el agente puede invocar DURANTE el chat (Opción A: el backend
 * orquesta el tool-calling). Son las mismas operaciones que el MCP server,
 * pero `companyId` se inyecta server-side desde el contexto del chat —el
 * modelo nunca lo elige—, garantizando el aislamiento (RNF2).
 *
 * Formato: function-calling de OpenAI (lo entiende el proxy de Hermes).
 */
export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "update_company",
      description:
        "Actualiza datos de la empresa actual: rubro, localidad, tarifas, etapa de onboarding y % de perfil.",
      parameters: {
        type: "object",
        properties: {
          industry: { type: "string", description: "Rubro / industria" },
          location: {
            type: "string",
            enum: ["ushuaia", "rio_grande", "tolhuin"],
          },
          gasTariff: { type: "number", description: "$ por m³ de gas" },
          electricityTariff: { type: "number", description: "$ por kWh" },
          onboardingStage: {
            type: "string",
            enum: ["identity", "equipment", "operation", "tariffs", "complete"],
          },
          profileCompletion: {
            type: "number",
            description: "Porcentaje de perfil completado (0–100)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_equipment",
      description: "Agrega un equipo consumidor de energía a la empresa actual.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          vector: { type: "string", enum: ["gas", "electricity"] },
          power: {
            type: "number",
            description: "Potencia: kW si es electricidad, m³/h si es gas",
          },
          hoursPerDay: { type: "number", description: "Horas de uso por día (0–24)" },
          daysPerMonth: { type: "number", description: "Días de uso por mes (0–31)" },
        },
        required: ["name", "vector", "power"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_equipment",
      description: "Lista los equipos cargados de la empresa actual con su consumo mensual.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "project_consumption",
      description:
        "Calcula y guarda la proyección de consumo y costo de la empresa actual para una temperatura prevista.",
      parameters: {
        type: "object",
        properties: {
          forecastTemp: { type: "number", description: "Temperatura prevista en °C" },
        },
        required: ["forecastTemp"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "profile_status",
      description: "Devuelve la etapa de onboarding y el % de perfil de la empresa actual.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const projectArgs = z.object({ forecastTemp: z.number() });

/**
 * Ejecuta una tool del agente contra los services. Devuelve SIEMPRE un string
 * (el resultado se le devuelve al modelo). Si algo falla, devuelve el error
 * como texto para que el modelo pueda corregir, en vez de romper el stream.
 */
export async function executeAgentTool(
  companyId: string,
  name: string,
  rawArgs: unknown,
): Promise<string> {
  try {
    switch (name) {
      case "update_company": {
        const fields = updateCompanySchema.parse(rawArgs ?? {});
        const company = await companyService.update(companyId, fields);
        return `OK. Empresa actualizada: etapa ${company.onboardingStage}, perfil ${company.profileCompletion}%.`;
      }
      case "add_equipment": {
        const input = createEquipmentSchema.parse(rawArgs ?? {});
        const eq = await equipmentService.create(companyId, input);
        return `OK. Equipo agregado: ${eq.name} (${VECTOR_LABEL[eq.vector]}, potencia ${Number(eq.power)}).`;
      }
      case "list_equipment": {
        const items = await equipmentService.listByCompany(companyId);
        if (items.length === 0) return "La empresa todavía no tiene equipos.";
        return items
          .map(
            (e) =>
              `- ${e.name} (${VECTOR_LABEL[e.vector]}): ${formatNumber(e.monthlyConsumption)}/mes`,
          )
          .join("\n");
      }
      case "project_consumption": {
        const { forecastTemp } = projectArgs.parse(rawArgs ?? {});
        const { projection } = await projectionService.compute(companyId, {
          forecastTemp,
        });
        return (
          `Proyección a ${forecastTemp}°C: consumo ${formatNumber(projection.estimatedConsumption)}, ` +
          `costo ${formatCurrency(projection.estimatedCost)}, variación ${Number(projection.variationPct ?? 0).toFixed(1)}%.`
        );
      }
      case "profile_status": {
        const status = await companyService.getProfileStatus(companyId);
        return `Etapa ${status.onboardingStage}, perfil ${status.profileCompletion}%${status.hasTariffs ? ", con tarifas" : ", sin tarifas"}.`;
      }
      default:
        return `Error: tool desconocida "${name}".`;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error ejecutando ${name}: ${message}`;
  }
}
