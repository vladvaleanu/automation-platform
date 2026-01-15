-- TimescaleDB Hypertable Configuration
-- NOTE: This migration is a placeholder. TimescaleDB optimization should be applied manually
-- if needed, as the migration runner doesn't support complex PL/pgSQL blocks.
--
-- To enable TimescaleDB manually, run:
-- CREATE EXTENSION IF NOT EXISTS timescaledb;
-- SELECT create_hypertable('consumption_readings', 'timestamp', if_not_exists => TRUE);
-- SELECT add_compression_policy('consumption_readings', INTERVAL '30 days', if_not_exists => TRUE);
-- SELECT add_retention_policy('consumption_readings', INTERVAL '2 years', if_not_exists => TRUE);

-- Add comment about TimescaleDB optimization
COMMENT ON TABLE "consumption_readings" IS 'Time-series power consumption readings (TimescaleDB hypertable if available)';
