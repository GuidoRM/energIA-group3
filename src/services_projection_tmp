/**
 * Projection service — domain logic, framework-agnostic.
 *
 * Implements the consumption model documented in schema_en.sql:
 *   estimated_consumption = base_consumption *
 *     (1 + sensitivity_per_degree * (reference_temp - forecast_temp))
 */

export interface ProjectionInput {
  /** Sum of the company's equipment consumption at the reference temperature. */
  baseConsumption: number;
  /** Fraction by which consumption rises per °C below the reference. */
  sensitivityPerDegree: number;
  /** "Mild month" baseline temperature, °C. */
  referenceTemp: number;
  /** Forecast mean temperature for the projected month, °C. */
  forecastTemp: number;
  /** Tariff applied to the dominant energy vector ($ per unit). */
  tariff: number;
}

export interface ProjectionResult {
  estimatedConsumption: number;
  estimatedCost: number;
  variationPct: number;
}

export function projectConsumption({
  baseConsumption,
  sensitivityPerDegree,
  referenceTemp,
  forecastTemp,
  tariff,
}: ProjectionInput): ProjectionResult {
  const factor = 1 + sensitivityPerDegree * (referenceTemp - forecastTemp);
  const estimatedConsumption = baseConsumption * factor;

  return {
    estimatedConsumption,
    estimatedCost: estimatedConsumption * tariff,
    variationPct: (factor - 1) * 100,
  };
}
