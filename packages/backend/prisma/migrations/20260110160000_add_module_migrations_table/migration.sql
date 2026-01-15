-- CreateTable
CREATE TABLE "module_migrations" (
    "id" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "executionTime" INTEGER,

    CONSTRAINT "module_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "module_migrations_moduleName_idx" ON "module_migrations"("moduleName");

-- CreateIndex
CREATE INDEX "module_migrations_appliedAt_idx" ON "module_migrations"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "module_migrations_moduleName_filename_key" ON "module_migrations"("moduleName", "filename");
