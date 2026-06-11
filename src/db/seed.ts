/**
 * Database seed — datos de referencia [SEED] (§14.1).
 *   · model_coefficient: coeficientes clima→consumo (gas/electricidad).
 *   · monthly_climate: serie de temperatura media mensual por localidad (IPIEC).
 *
 * Run: `npm run db:seed`
 */
import "@/config/load-env";

import { db } from "./index";
import { modelCoefficient, monthlyClimate } from "./schema";

type Location = "ushuaia" | "rio_grande" | "tolhuin";

/**
 * Temperatura media mensual (°C) representativa por localidad (perfil anual
 * típico de Tierra del Fuego). Sirve de base histórica para el dashboard de
 * clima (RF5.1) y para estimar la temperatura prevista (RF5.2). Ene…Dic.
 */
const MONTHLY_MEAN_TEMP: Record<Location, number[]> = {
  rio_grande: [10.5, 10.2, 8.4, 5.6, 2.9, 0.8, 0.4, 1.6, 3.7, 6.1, 8.0, 9.6],
  ushuaia: [9.6, 9.3, 7.8, 5.5, 3.2, 1.4, 1.0, 1.9, 3.6, 5.6, 7.2, 8.7],
  tolhuin: [9.9, 9.6, 7.9, 5.2, 2.6, 0.6, 0.2, 1.3, 3.4, 5.8, 7.6, 9.2],
};

const SEED_YEARS = [2023, 2024, 2025];

async function seedCoefficients() {
  console.log("🌱 model_coefficient…");
  await db
    .insert(modelCoefficient)
    .values([
      {
        vector: "gas",
        sensitivityPerDegree: "0.04300",
        referenceTemp: "10.00",
        r2: "0.905",
        note: "Measured on IPIEC monthly gas vs. mean temp Rio Grande, 2023-2025.",
      },
      {
        vector: "electricity",
        sensitivityPerDegree: "0.01000",
        referenceTemp: "10.00",
        r2: "0.128",
        note: "Weak correlation with climate; main driver = shifts/activity.",
      },
    ])
    .onConflictDoNothing({ target: modelCoefficient.vector });
}

async function seedClimate() {
  console.log("🌱 monthly_climate…");
  const rows = [];
  for (const [location, temps] of Object.entries(MONTHLY_MEAN_TEMP)) {
    for (const year of SEED_YEARS) {
      for (let month = 1; month <= 12; month++) {
        // pequeña variación interanual determinística (sin Math.random).
        const jitter = (year - 2024) * 0.2;
        rows.push({
          location: location as Location,
          year,
          month,
          meanTemp: (temps[month - 1]! + jitter).toFixed(2),
        });
      }
    }
  }
  await db.insert(monthlyClimate).values(rows).onConflictDoNothing();
  console.log(`   ${rows.length} filas de clima.`);
}

async function seed() {
  await seedCoefficients();
  await seedClimate();
  console.log("✅ Seed completo.");
}

seed()
  .catch((err) => {
    console.error("❌ Seed falló:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
