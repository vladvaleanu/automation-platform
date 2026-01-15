-- CreateTable
CREATE TABLE "endpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vendor" TEXT,
    "location" TEXT,
    "clientName" TEXT,
    "authType" TEXT NOT NULL DEFAULT 'none',
    "authConfig" JSONB,
    "scrapingConfig" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pollInterval" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_readings" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalKwh" DOUBLE PRECISION,
    "currentKwh" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "power" DOUBLE PRECISION,
    "powerFactor" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "rawData" JSONB,

    CONSTRAINT "consumption_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "endpoints_enabled_idx" ON "endpoints"("enabled");

-- CreateIndex
CREATE INDEX "endpoints_clientName_idx" ON "endpoints"("clientName");

-- CreateIndex
CREATE INDEX "consumption_readings_endpointId_idx" ON "consumption_readings"("endpointId");

-- CreateIndex
CREATE INDEX "consumption_readings_timestamp_idx" ON "consumption_readings"("timestamp");

-- CreateIndex
CREATE INDEX "consumption_readings_endpointId_timestamp_idx" ON "consumption_readings"("endpointId", "timestamp");

-- AddForeignKey
ALTER TABLE "consumption_readings" ADD CONSTRAINT "consumption_readings_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
