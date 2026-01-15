-- Create Endpoints table
-- Stores configuration for power meter endpoints to scrape

CREATE TABLE IF NOT EXISTS "endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vendor" TEXT,
    "location" TEXT,
    "clientName" TEXT,

    -- Authentication configuration
    "authType" TEXT NOT NULL DEFAULT 'none',
    "authConfig" JSONB,

    -- Scraping configuration
    "scrapingConfig" JSONB NOT NULL,

    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pollInterval" INTEGER NOT NULL DEFAULT 15,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3)
);

-- Create indexes for endpoints
CREATE INDEX IF NOT EXISTS "endpoints_enabled_idx" ON "endpoints"("enabled");
CREATE INDEX IF NOT EXISTS "endpoints_clientName_idx" ON "endpoints"("clientName");

-- Add comments
COMMENT ON TABLE "endpoints" IS 'Power meter endpoint configurations for consumption monitoring';
COMMENT ON COLUMN "endpoints"."name" IS 'Human-readable name (e.g., "Rack A3 PDU")';
COMMENT ON COLUMN "endpoints"."ipAddress" IS 'IP address of the power meter web interface';
COMMENT ON COLUMN "endpoints"."type" IS 'Device type: PDU, PowerMeter, SmartPlug, Custom';
COMMENT ON COLUMN "endpoints"."authType" IS 'Authentication method: none, basic, form, custom';
COMMENT ON COLUMN "endpoints"."authConfig" IS 'JSON authentication credentials and configuration';
COMMENT ON COLUMN "endpoints"."scrapingConfig" IS 'JSON scraping steps and selectors';
COMMENT ON COLUMN "endpoints"."pollInterval" IS 'Minutes between automatic readings';
