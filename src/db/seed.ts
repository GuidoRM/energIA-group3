/**
 * Database seed — reference data that mirrors the [SEED] blocks of schema_en.sql.
 * Run with: `npm run db:seed`
 */
import { db } from "./index";
import { modelCoefficient } from "./schema";

async function seed() {
  console.log("🌱 Seeding model_coefficient…");

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

  console.log("✅ Seed complete.");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
