/**
 * seed-demo.ts — puebla la primera empresa de la cuenta con datos ricos:
 *   · Nombre "Austral Energy" · Metalúrgica · Río Grande
 *   · 12 equipos industriales (gas + electricidad)
 *   · 18 proyecciones (2025 completo + Ene-Jun 2026)
 *   · 9 alertas (3 no leídas, 6 leídas)
 *   · Onboarding completo 100%
 *
 * Run: npm run db:seed-demo
 */
import "@/config/load-env";

import { eq } from "drizzle-orm";
import { db } from "./index";
import { company, equipment, projection, alert } from "./schema";

// ─── Tarifas ────────────────────────────────────────────────────────────────
const GAS_TARIFF  = "62.50";   // ARS / m³
const ELEC_TARIFF = "145.80";  // ARS / kWh

// ─── Equipos ─────────────────────────────────────────────────────────────────
// Base gas:  (25*8 + 15*6 + 12*4 + 8*10) * 22 = (200+90+48+80)*22 = 9 196 m³/mes
// Base elec: (45*10+22*8+18*8+14*10+12*6+15*4+7.5*8+5.5*6)*22
//           = (450+176+144+140+72+60+60+33)*22 = 1135*22 = 24 970 kWh/mes
const BASE_GAS_M3   = 9_196;
const BASE_ELEC_KWH = 24_970;

const EQUIPMENT = [
  // — Gas —
  { name: "Horno industrial principal",  vector: "gas"         as const, power: "25.000", hoursPerDay: "8",  daysPerMonth: 22, processStage: "Producción"   },
  { name: "Caldera de vapor",            vector: "gas"         as const, power: "15.000", hoursPerDay: "6",  daysPerMonth: 22, processStage: "Calefacción"  },
  { name: "Horno de tratamiento térmico",vector: "gas"         as const, power: "12.000", hoursPerDay: "4",  daysPerMonth: 20, processStage: "Producción"   },
  { name: "Calefacción nave principal",  vector: "gas"         as const, power: "8.000",  hoursPerDay: "10", daysPerMonth: 22, processStage: "Confort"      },
  // — Electricidad —
  { name: "Compresor de aire industrial",vector: "electricity" as const, power: "45.000", hoursPerDay: "10", daysPerMonth: 22, processStage: "Producción"   },
  { name: "Tornos CNC (x3)",             vector: "electricity" as const, power: "22.000", hoursPerDay: "8",  daysPerMonth: 22, processStage: "Mecanizado"   },
  { name: "Fresadoras CNC (x2)",         vector: "electricity" as const, power: "18.000", hoursPerDay: "8",  daysPerMonth: 22, processStage: "Mecanizado"   },
  { name: "Sistema de iluminación LED",  vector: "electricity" as const, power: "14.000", hoursPerDay: "10", daysPerMonth: 22, processStage: "General"      },
  { name: "Soldadoras MIG/TIG (x6)",     vector: "electricity" as const, power: "12.000", hoursPerDay: "6",  daysPerMonth: 22, processStage: "Ensamble"     },
  { name: "Grúa puente 5t",              vector: "electricity" as const, power: "15.000", hoursPerDay: "4",  daysPerMonth: 22, processStage: "Logística"    },
  { name: "Ventilación industrial",      vector: "electricity" as const, power: "7.500",  hoursPerDay: "8",  daysPerMonth: 22, processStage: "General"      },
  { name: "Bomba hidráulica",            vector: "electricity" as const, power: "5.500",  hoursPerDay: "6",  daysPerMonth: 22, processStage: "Producción"   },
];

// ─── Series climáticas ───────────────────────────────────────────────────────
// Temperatura media mensual Río Grande (°C) · Ene…Dic
const TEMP_RIO_GRANDE = [10.5, 10.2, 8.4, 5.6, 2.9, 0.8, 0.4, 1.6, 3.7, 6.1, 8.0, 9.6];

// ─── Modelo clima → consumo ──────────────────────────────────────────────────
const REF_TEMP   = 10.0;
const GAS_SENS   = 0.043;   // fracción/°C · gas
const ELEC_SENS  = 0.010;   // fracción/°C · electricidad

function calcProjection(temp: number): {
  estimatedConsumption: string;
  estimatedCost: string;
  variationPct: string;
} {
  const gasMult  = 1 + GAS_SENS  * (REF_TEMP - temp);
  const elecMult = 1 + ELEC_SENS * (REF_TEMP - temp);

  const gasConsumption  = BASE_GAS_M3   * gasMult;
  const elecConsumption = BASE_ELEC_KWH * elecMult;
  const gasCost         = gasConsumption  * parseFloat(GAS_TARIFF);
  const elecCost        = elecConsumption * parseFloat(ELEC_TARIFF);
  const totalCost       = gasCost + elecCost;

  const baseCost = BASE_GAS_M3 * parseFloat(GAS_TARIFF) + BASE_ELEC_KWH * parseFloat(ELEC_TARIFF);
  const variation = ((totalCost - baseCost) / baseCost) * 100;

  return {
    estimatedConsumption: gasConsumption.toFixed(2),
    estimatedCost:        totalCost.toFixed(2),
    variationPct:         variation.toFixed(2),
  };
}

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                     "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── Main ────────────────────────────────────────────────────────────────────
async function seedDemo() {
  const companies = await db.select().from(company).limit(1);
  if (companies.length === 0) {
    console.error("❌  No hay empresas. Registrá una empresa primero.");
    process.exit(1);
  }
  const c = companies[0]!;
  console.log(`\n🏭  Empresa: "${c.name}" → renombrando a "Austral Energy"`);

  // 1. Actualizar empresa
  await db.update(company).set({
    name:               "Austral Energy",
    industry:           "Metalúrgica e Ingeniería Industrial",
    location:           "rio_grande",
    gasTariff:          GAS_TARIFF,
    electricityTariff:  ELEC_TARIFF,
    onboardingStage:    "complete",
    profileCompletion:  100,
  }).where(eq(company.id, c.id));
  console.log("   ✓ Empresa actualizada");

  // 2. Limpiar datos anteriores
  await db.delete(alert)     .where(eq(alert.companyId,      c.id));
  await db.delete(projection).where(eq(projection.companyId, c.id));
  await db.delete(equipment) .where(eq(equipment.companyId,  c.id));
  console.log("   ✓ Datos anteriores eliminados");

  // 3. Equipos
  await db.insert(equipment).values(EQUIPMENT.map((e) => ({ ...e, companyId: c.id })));
  console.log(`   ✓ ${EQUIPMENT.length} equipos`);

  // 4. Proyecciones: 2025 completo + Ene-Jun 2026
  const projIds: Record<string, string> = {};

  // 2025 — 12 meses con temperatura real de Río Grande
  for (let month = 1; month <= 12; month++) {
    const temp = TEMP_RIO_GRANDE[month - 1]!;
    const { estimatedConsumption, estimatedCost, variationPct } = calcProjection(temp);
    const [p] = await db.insert(projection).values({
      companyId: c.id, year: 2025, month,
      forecastTemp: temp.toFixed(2),
      estimatedConsumption, estimatedCost, variationPct,
    }).returning({ id: projection.id });
    projIds[`2025-${month}`] = p!.id;
    console.log(`   · ${MONTH_NAMES[month-1]!.padEnd(11)} 2025  ${temp.toFixed(1).padStart(5)}°C  $${parseFloat(estimatedCost).toLocaleString("es-AR",{maximumFractionDigits:0}).padStart(11)}  var ${parseFloat(variationPct)>0?"+":""}${variationPct}%`);
  }

  // 2026 — Ene-Jun (año un poco más cálido: +0.3°C)
  for (let month = 1; month <= 6; month++) {
    const temp = +(TEMP_RIO_GRANDE[month - 1]! + 0.3).toFixed(1);
    const { estimatedConsumption, estimatedCost, variationPct } = calcProjection(temp);
    const [p] = await db.insert(projection).values({
      companyId: c.id, year: 2026, month,
      forecastTemp: temp.toFixed(2),
      estimatedConsumption, estimatedCost, variationPct,
    }).returning({ id: projection.id });
    projIds[`2026-${month}`] = p!.id;
    console.log(`   · ${MONTH_NAMES[month-1]!.padEnd(11)} 2026  ${temp.toFixed(1).padStart(5)}°C  $${parseFloat(estimatedCost).toLocaleString("es-AR",{maximumFractionDigits:0}).padStart(11)}  var ${parseFloat(variationPct)>0?"+":""}${variationPct}%`);
  }
  console.log(`   ✓ 18 proyecciones`);

  // 5. Alertas
  const alerts = [
    // ── No leídas (3) ────────────────────────────────────────────────────────
    {
      companyId: c.id,
      projectionId: projIds["2025-7"]!,
      type: "consumption_spike" as const, severity: "high" as const, isRead: false,
      message: "Pico de consumo crítico en Julio 2025: el gas proyectado supera los 13.000 m³ (+41,3% sobre referencia). La temperatura de 0,4°C dispara la demanda del horno industrial y la calefacción de nave. Acción recomendada: revisar aislación térmica y escalonar el encendido de equipos.",
    },
    {
      companyId: c.id,
      projectionId: projIds["2025-6"]!,
      type: "cost_spike" as const, severity: "high" as const, isRead: false,
      message: "Costo energético de Junio 2025 supera los $5.800.000 ARS (+39,6% interanual). El frío extremo de Tierra del Fuego eleva el gasto en gas un 53% respecto a meses estivales. Se recomienda evaluar contratos de abastecimiento con precios estacionales.",
    },
    {
      companyId: c.id,
      projectionId: projIds["2026-5"]!,
      type: "cost_spike" as const, severity: "medium" as const, isRead: false,
      message: "Proyección Mayo 2026: costo estimado $5.200.000 ARS. A pesar de una mejora leve vs. 2025, el gasto energético invernal sigue representando el 34% del costo operativo mensual de la planta.",
    },
    // ── Leídas (6) ───────────────────────────────────────────────────────────
    {
      companyId: c.id,
      projectionId: projIds["2025-8"]!,
      type: "consumption_spike" as const, severity: "medium" as const, isRead: true,
      message: "Agosto 2025: consumo de gas estimado en 12.512 m³ (+36,1%). Segunda mitad del invierno con temperaturas sostenidas bajo 2°C. El horno de tratamiento térmico opera al máximo de su ciclo.",
    },
    {
      companyId: c.id,
      projectionId: projIds["2025-5"]!,
      type: "consumption_spike" as const, severity: "medium" as const, isRead: true,
      message: "Mayo 2025: inicio del período frío con consumo de gas +30,5% respecto al mes base. Se recomienda adelantar el mantenimiento preventivo de la caldera de vapor antes del pico invernal.",
    },
    {
      companyId: c.id,
      projectionId: projIds["2025-4"]!,
      type: "anomaly" as const, severity: "low" as const, isRead: true,
      message: "Abril 2025: variación del +18,9%. Anomalía detectada en el consumo nocturno del compresor de aire — posible fuga en la red de distribución neumática. Verificar presión en el punto de distribución secundario.",
    },
    {
      companyId: c.id,
      projectionId: projIds["2025-9"]!,
      type: "anomaly" as const, severity: "low" as const, isRead: true,
      message: "Septiembre 2025: consumo eléctrico 8% por encima de la proyección modelo. Las fresadoras CNC registraron tiempos de ciclo extendidos. Considerar calibración de parámetros de corte para reducir consumo por pieza.",
    },
    {
      companyId: c.id,
      projectionId: projIds["2025-3"]!,
      type: "anomaly" as const, severity: "low" as const, isRead: true,
      message: "Marzo 2025: variación +6,9%. Primera alerta estacional del año. El descenso de temperaturas activa la calefacción de nave con mayor frecuencia. Verificar sellado de portones de la nave de producción.",
    },
    {
      companyId: c.id,
      projectionId: projIds["2026-4"]!,
      type: "cost_spike" as const, severity: "medium" as const, isRead: true,
      message: "Abril 2026: costo proyectado $4.980.000 ARS (+17,8% sobre referencia). Escenario similar a Abril 2025. Se sugiere implementar el programa de eficiencia propuesto por el Copiloto Energético en la instancia anterior.",
    },
  ];

  await db.insert(alert).values(alerts);
  console.log(`   ✓ ${alerts.length} alertas (3 no leídas, 6 leídas)\n`);
  console.log("✅  Seed completo. Refrescá la app.");
}

seedDemo()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .then(() => process.exit(0));
