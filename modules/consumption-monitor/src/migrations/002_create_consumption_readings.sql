-- Create Consumption Readings table
-- Stores time-series power consumption data scraped from endpoints

CREATE TABLE IF NOT EXISTS "consumption_readings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "endpointId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Consumption data
    "totalKwh" DOUBLE PRECISION,
    "currentKwh" DOUBLE PRECISION,

    -- Optional instantaneous metrics
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "power" DOUBLE PRECISION,
    "powerFactor" DOUBLE PRECISION,

    -- Metadata
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "rawData" JSONB,

    -- Foreign key
    CONSTRAINT "consumption_readings_endpointId_fkey"
        FOREIGN KEY ("endpointId")
        REFERENCES "endpoints"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Create indexes for consumption_readings
CREATE INDEX IF NOT EXISTS "consumption_readings_endpointId_idx"
    ON "consumption_readings"("endpointId");

CREATE INDEX IF NOT EXISTS "consumption_readings_timestamp_idx"
    ON "consumption_readings"("timestamp");

CREATE INDEX IF NOT EXISTS "consumption_readings_endpointId_timestamp_idx"
    ON "consumption_readings"("endpointId", "timestamp");

-- Add comments
COMMENT ON TABLE "consumption_readings" IS 'Time-series power consumption readings from endpoints';
COMMENT ON COLUMN "consumption_readings"."totalKwh" IS 'Cumulative total consumption in kilowatt-hours';
COMMENT ON COLUMN "consumption_readings"."currentKwh" IS 'Current month consumption (calculated delta)';
COMMENT ON COLUMN "consumption_readings"."voltage" IS 'Instantaneous voltage in volts';
COMMENT ON COLUMN "consumption_readings"."current" IS 'Instantaneous current in amperes';
COMMENT ON COLUMN "consumption_readings"."power" IS 'Instantaneous power in watts';
COMMENT ON COLUMN "consumption_readings"."powerFactor" IS 'Power factor (0-1)';
COMMENT ON COLUMN "consumption_readings"."success" IS 'Whether the reading was successful';
COMMENT ON COLUMN "consumption_readings"."errorMessage" IS 'Error message if reading failed';
COMMENT ON COLUMN "consumption_readings"."rawData" IS 'Raw scraped data for debugging';
