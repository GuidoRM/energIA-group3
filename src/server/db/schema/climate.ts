import { sql } from "drizzle-orm";
import {
  check,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { energyVector, tdfLocation } from "./enums";

/** MONTHLY_CLIMATE [SEED] — IPIEC mean-temperature series. */
export const monthlyClimate = pgTable(
  "monthly_climate",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    location: tdfLocation("location").notNull(),
    year: smallint("year").notNull(),
    month: smallint("month").notNull(),
    /** °C */
    meanTemp: numeric("mean_temp", { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [
    unique("monthly_climate_loc_year_month").on(
      table.location,
      table.year,
      table.month,
    ),
    index("idx_climate_loc_date").on(table.location, table.year, table.month),
    check("climate_year_check", sql`${table.year} BETWEEN 1990 AND 2100`),
    check("climate_month_check", sql`${table.month} BETWEEN 1 AND 12`),
  ],
);

/**
 * MODEL_COEFFICIENT [SEED] — climate→consumption sensitivity per vector.
 *
 * Projection formula (per energy vector):
 *   estimated_consumption = base_consumption *
 *     (1 + sensitivity_per_degree * (reference_temp - forecast_temp))
 */
export const modelCoefficient = pgTable("model_coefficient", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vector: energyVector("vector").notNull().unique(),
  /** fraction /°C (gas ≈ 0.043) */
  sensitivityPerDegree: numeric("sensitivity_per_degree", {
    precision: 8,
    scale: 5,
  }).notNull(),
  /** °C "mild" baseline */
  referenceTemp: numeric("reference_temp", { precision: 5, scale: 2 }).notNull(),
  /** goodness of fit (0–1) */
  r2: numeric("r2", { precision: 4, scale: 3 }),
  note: text("note"),
});
