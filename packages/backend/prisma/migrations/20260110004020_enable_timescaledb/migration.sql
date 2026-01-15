-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert consumption_readings table to hypertable
-- This optimizes it for time-series data with automatic partitioning by timestamp
SELECT create_hypertable('consumption_readings', 'timestamp', if_not_exists => TRUE);

-- Create continuous aggregate for hourly consumption data
-- This pre-aggregates data for faster queries
CREATE MATERIALIZED VIEW IF NOT EXISTS consumption_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  "endpointId",
  AVG("totalKwh") as avg_total_kwh,
  MAX("totalKwh") as max_total_kwh,
  MIN("totalKwh") as min_total_kwh,
  AVG(voltage) as avg_voltage,
  AVG(current) as avg_current,
  AVG(power) as avg_power,
  COUNT(*) as reading_count,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_readings
FROM consumption_readings
GROUP BY hour, "endpointId";

-- Add refresh policy to automatically update the continuous aggregate
SELECT add_continuous_aggregate_policy('consumption_readings_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE);

-- Set data retention policy: keep raw data for 2 years
SELECT add_retention_policy('consumption_readings', INTERVAL '2 years', if_not_exists => TRUE);
