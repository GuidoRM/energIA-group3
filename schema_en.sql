-- ============================================================================
--  ENERGY OPTIMIZER FOR PATAGONIAN SMEs  ·  IATHON 2026
--  Database schema · PostgreSQL 13+
--
--  Write layers:
--    [UI]    written by the interface / user
--    [MCP]   written by Hermes through the MCP server
--    [SEED]  preloaded reference data (IPIEC)
--
--  Re-runnable script: enums guarded with DO, tables with IF NOT EXISTS,
--  seeds with ON CONFLICT DO NOTHING.
-- ============================================================================

-- gen_random_uuid() is native in PG13+.
-- Only PG<13 needs the extension; uncomment the line below if that's your case.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
--  RESET (optional) — uncomment to rebuild everything from scratch.
-- ----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS message, conversation, alert, projection,
--   equipment, company, app_user, organization, monthly_climate,
--   model_coefficient CASCADE;
-- DROP TYPE IF EXISTS energy_vector, user_role, onboarding_stage,
--   message_role, alert_severity, alert_type, tdf_location CASCADE;

-- ============================================================================
--  ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE tdf_location AS ENUM ('ushuaia', 'rio_grande', 'tolhuin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE energy_vector AS ENUM ('gas', 'electricity');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE onboarding_stage AS ENUM
    ('identity', 'equipment', 'operation', 'tariffs', 'complete');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'assistant', 'tool');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('consumption_spike', 'cost_spike', 'anomaly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
--  TRIGGER · auto updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
--  ORGANIZATION  [UI]
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
--  USER  [UI]  — belongs to an organization
--  (named app_user: "user" is a reserved word in PostgreSQL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_user (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  name             TEXT NOT NULL,
  role             user_role NOT NULL DEFAULT 'member',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_org ON app_user(organization_id);

-- ============================================================================
--  COMPANY  [UI]+[MCP]  — the digital twin
-- ============================================================================
CREATE TABLE IF NOT EXISTS company (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  industry          TEXT,
  location          tdf_location NOT NULL DEFAULT 'rio_grande',
  gas_tariff        NUMERIC(12,4) CHECK (gas_tariff  >= 0),   -- $ per m³
  electricity_tariff NUMERIC(12,4) CHECK (electricity_tariff >= 0),  -- $ per kWh
  onboarding_stage  onboarding_stage NOT NULL DEFAULT 'identity',
  profile_completion SMALLINT NOT NULL DEFAULT 0
                      CHECK (profile_completion BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_org ON company(organization_id);

DROP TRIGGER IF EXISTS trg_company_upd ON company;
CREATE TRIGGER trg_company_upd BEFORE UPDATE ON company
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
--  EQUIPMENT  [MCP]+[UI]  — consumption items of each company
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  vector          energy_vector NOT NULL,
  power           NUMERIC(12,3) NOT NULL CHECK (power > 0),  -- kW (elec) or m³/h (gas)
  hours_per_day   NUMERIC(5,2)  NOT NULL DEFAULT 0
                    CHECK (hours_per_day BETWEEN 0 AND 24),
  days_per_month  SMALLINT      NOT NULL DEFAULT 0
                    CHECK (days_per_month BETWEEN 0 AND 31),
  process_stage   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_company ON equipment(company_id);

-- ============================================================================
--  MONTHLY_CLIMATE  [SEED]  — IPIEC series (table 22_2_01)
-- ============================================================================
CREATE TABLE IF NOT EXISTS monthly_climate (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location    tdf_location NOT NULL,
  year        SMALLINT NOT NULL CHECK (year BETWEEN 1990 AND 2100),
  month       SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  mean_temp   NUMERIC(5,2) NOT NULL,                          -- °C
  UNIQUE (location, year, month)
);
CREATE INDEX IF NOT EXISTS idx_climate_loc_date ON monthly_climate(location, year, month);

-- ============================================================================
--  MODEL_COEFFICIENT  [SEED]  — climate→consumption sensitivity per vector
--
--  Projection formula (per energy vector):
--    estimated_consumption = base_consumption * (1 + sensitivity_per_degree *
--                                          (reference_temp - forecast_temp))
--  where base_consumption is computed by summing the company's equipment.
--  'sensitivity_per_degree' is the fraction by which consumption rises per °C
--  below the reference temperature.
--
--  Values measured on IPIEC data (gas 2023-2025): r = -0.95.
-- ============================================================================
CREATE TABLE IF NOT EXISTS model_coefficient (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vector                energy_vector NOT NULL UNIQUE,
  sensitivity_per_degree NUMERIC(8,5) NOT NULL,   -- fraction /°C (gas ≈ 0.043)
  reference_temp        NUMERIC(5,2) NOT NULL,    -- °C "mild" baseline
  r2                    NUMERIC(4,3),             -- goodness of fit (0–1)
  note                  TEXT
);

-- ============================================================================
--  PROJECTION  [MCP]  — system output (generated by project_consumption)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projection (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  year                  SMALLINT NOT NULL CHECK (year BETWEEN 1990 AND 2100),
  month                 SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  forecast_temp         NUMERIC(5,2) NOT NULL,
  estimated_consumption NUMERIC(16,2) NOT NULL,   -- unit depends on dominant vector
  estimated_cost        NUMERIC(16,2) NOT NULL,   -- $
  variation_pct         NUMERIC(6,2),             -- % vs. mild reference month
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projection_company
  ON projection(company_id, year, month);

-- ============================================================================
--  ALERT  [MCP]  — fired when a projection exceeds a threshold
-- ============================================================================
CREATE TABLE IF NOT EXISTS alert (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  projection_id UUID REFERENCES projection(id) ON DELETE SET NULL,
  type          alert_type NOT NULL,
  severity      alert_severity NOT NULL DEFAULT 'medium',
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alert_company ON alert(company_id, is_read);

-- ============================================================================
--  CONVERSATION  [UI]  — groups the messages of a chat with Hermes
--  hermes_session_id: hinge to chain context on Hermes's side
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  user_id            UUID REFERENCES app_user(id) ON DELETE SET NULL,
  title              TEXT,
  hermes_session_id  TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversation_company ON conversation(company_id);
CREATE INDEX IF NOT EXISTS idx_conversation_hermes  ON conversation(hermes_session_id);

DROP TRIGGER IF EXISTS trg_conversation_upd ON conversation;
CREATE TRIGGER trg_conversation_upd BEFORE UPDATE ON conversation
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
--  MESSAGE  [UI]+[MCP]  — each chat turn (to display and navigate)
-- ============================================================================
CREATE TABLE IF NOT EXISTS message (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  role             message_role NOT NULL,
  content          TEXT NOT NULL DEFAULT '',
  tool_name        TEXT,          -- if role='tool': which MCP tool was called
  tool_args        JSONB,         -- tool arguments, if applicable
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_message_conv ON message(conversation_id, created_at);

-- ============================================================================
--  SEED · MODEL_COEFFICIENT
--  Gas: measured on IPIEC 2023-2025 (r=-0.95). ~+4.3% consumption per °C
--       below a mild month.
--  Electricity: weak correlation with climate (r=-0.36); real driver is
--       shifts/activity. Small, indicative sensitivity.
--  reference_temp: tune it to the "mild month" you use as baseline.
-- ============================================================================
INSERT INTO model_coefficient (vector, sensitivity_per_degree, reference_temp, r2, note)
VALUES
  ('gas',         0.04300, 10.00, 0.905,
   'Measured on IPIEC monthly gas vs. mean temp Rio Grande, 2023-2025.'),
  ('electricity', 0.01000, 10.00, 0.128,
   'Weak correlation with climate; main driver = shifts/activity.')
ON CONFLICT (vector) DO NOTHING;

-- ============================================================================
--  SEED · DEMO DATA (optional) — company mid-onboarding (50%)
--  Handy to start the presentation without doing live signup.
-- ============================================================================
-- INSERT INTO organization (id, name)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Demo IATHON')
-- ON CONFLICT DO NOTHING;
--
-- INSERT INTO company (id, organization_id, name, industry, location,
--   gas_tariff, electricity_tariff, onboarding_stage, profile_completion)
-- VALUES ('00000000-0000-0000-0000-0000000000a1',
--   '00000000-0000-0000-0000-000000000001',
--   'Metalurgica Austral', 'Metallurgical', 'rio_grande',
--   NULL, NULL, 'equipment', 50)
-- ON CONFLICT DO NOTHING;
--
-- INSERT INTO equipment (company_id, name, vector, power, hours_per_day, days_per_month)
-- VALUES
--   ('00000000-0000-0000-0000-0000000000a1','Furnace','electricity',40,8,22),
--   ('00000000-0000-0000-0000-0000000000a1','Boiler','gas',25,10,22)
-- ON CONFLICT DO NOTHING;
