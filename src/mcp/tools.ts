import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  energyVectorSchema,
  onboardingStageSchema,
  tdfLocationSchema,
} from "@/lib/validation";
import { formatCurrency, formatNumber, VECTOR_LABEL } from "@/lib/format";
import { companyService } from "@/services/company.service";
import { equipmentService } from "@/services/equipment.service";
import { projectionService } from "@/services/projection.service";

/**
 * Tools MCP (§9). Cada una es un envoltorio FINO sobre la capa de servicios
 * —la misma que usa la API REST— y devuelve texto para Hermes. La lógica de
 * negocio vive una sola vez, en los services.
 */
function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

export function registerTools(server: McpServer): void {
  // create_company → company.create
  server.registerTool(
    "create_company",
    {
      description: "Crea una empresa (gemelo digital) en una organización.",
      inputSchema: {
        organizationId: z.string().uuid(),
        name: z.string(),
        industry: z.string().optional(),
        location: tdfLocationSchema.optional(),
        gasTariff: z.number().nonnegative().optional(),
        electricityTariff: z.number().nonnegative().optional(),
      },
    },
    async (args) => {
      const company = await companyService.create(args.organizationId, {
        name: args.name,
        industry: args.industry,
        location: args.location ?? "rio_grande",
        gasTariff: args.gasTariff,
        electricityTariff: args.electricityTariff,
      });
      return text(`Empresa creada: ${company.name} (id ${company.id}).`);
    },
  );

  // update_company → company.update
  server.registerTool(
    "update_company",
    {
      description:
        "Actualiza campos de una empresa (rubro, tarifas, etapa de onboarding, % de perfil).",
      inputSchema: {
        companyId: z.string().uuid(),
        name: z.string().optional(),
        industry: z.string().optional(),
        location: tdfLocationSchema.optional(),
        gasTariff: z.number().nonnegative().optional(),
        electricityTariff: z.number().nonnegative().optional(),
        onboardingStage: onboardingStageSchema.optional(),
        profileCompletion: z.number().int().min(0).max(100).optional(),
      },
    },
    async ({ companyId, ...fields }) => {
      const company = await companyService.update(companyId, fields);
      return text(
        `Empresa ${company.name} actualizada. Etapa: ${company.onboardingStage} (${company.profileCompletion}%).`,
      );
    },
  );

  // add_equipment → equipment.create
  server.registerTool(
    "add_equipment",
    {
      description: "Agrega un equipo consumidor de energía a una empresa.",
      inputSchema: {
        companyId: z.string().uuid(),
        name: z.string(),
        vector: energyVectorSchema,
        power: z.number().positive(),
        hoursPerDay: z.number().min(0).max(24).optional(),
        daysPerMonth: z.number().int().min(0).max(31).optional(),
      },
    },
    async (args) => {
      const eq = await equipmentService.create(args.companyId, {
        name: args.name,
        vector: args.vector,
        power: args.power,
        hoursPerDay: args.hoursPerDay ?? 0,
        daysPerMonth: args.daysPerMonth ?? 0,
      });
      return text(
        `Equipo agregado: ${eq.name} (${VECTOR_LABEL[eq.vector]}, ${args.power}).`,
      );
    },
  );

  // list_equipment → equipment.listByCompany
  server.registerTool(
    "list_equipment",
    {
      description: "Lista los equipos de una empresa con su consumo mensual.",
      inputSchema: { companyId: z.string().uuid() },
    },
    async ({ companyId }) => {
      const items = await equipmentService.listByCompany(companyId);
      if (items.length === 0) return text("La empresa no tiene equipos cargados.");
      const lines = items.map(
        (e) =>
          `- ${e.name} (${VECTOR_LABEL[e.vector]}): ${formatNumber(e.monthlyConsumption)}/mes`,
      );
      return text(`Equipos:\n${lines.join("\n")}`);
    },
  );

  // project_consumption → projection.compute
  server.registerTool(
    "project_consumption",
    {
      description:
        "Calcula y guarda la proyección de consumo y costo según la temperatura prevista.",
      inputSchema: {
        companyId: z.string().uuid(),
        forecastTemp: z.number(),
      },
    },
    async ({ companyId, forecastTemp }) => {
      const { projection } = await projectionService.compute(companyId, {
        forecastTemp,
      });
      return text(
        `Proyección a ${forecastTemp}°C: consumo ${formatNumber(projection.estimatedConsumption)}, ` +
          `costo ${formatCurrency(projection.estimatedCost)}, ` +
          `variación ${Number(projection.variationPct ?? 0).toFixed(1)}%.`,
      );
    },
  );

  // profile_status → company.getProfileStatus
  server.registerTool(
    "profile_status",
    {
      description: "Devuelve la etapa de onboarding y el % de perfil de una empresa.",
      inputSchema: { companyId: z.string().uuid() },
    },
    async ({ companyId }) => {
      const status = await companyService.getProfileStatus(companyId);
      return text(
        `${status.name}: etapa ${status.onboardingStage}, perfil ${status.profileCompletion}%` +
          `${status.hasTariffs ? ", con tarifas" : ", sin tarifas"}.`,
      );
    },
  );
}
