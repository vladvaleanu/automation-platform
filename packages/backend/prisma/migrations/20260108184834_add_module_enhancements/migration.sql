-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "author" TEXT,
ADD COLUMN     "config" JSONB,
ADD COLUMN     "path" TEXT;

-- CreateTable
CREATE TABLE "module_dependencies" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "versionRange" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_dependencies_moduleId_dependsOnId_key" ON "module_dependencies"("moduleId", "dependsOnId");

-- AddForeignKey
ALTER TABLE "module_dependencies" ADD CONSTRAINT "module_dependencies_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_dependencies" ADD CONSTRAINT "module_dependencies_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
