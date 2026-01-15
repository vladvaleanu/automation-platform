/**
 * Register consumption-monitor module with the NxForge platform
 */

const fs = require('fs');
const path = require('path');

async function registerModule() {
  // Read manifest
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log(`📦 Registering module: ${manifest.displayName} (${manifest.name})`);
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Routes: ${manifest.routes.length}`);
  console.log(`   Jobs: ${Object.keys(manifest.jobs).length}`);
  console.log('');

  // Import Prisma client
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Check if module already exists
    const existing = await prisma.module.findUnique({
      where: { name: manifest.name },
    });

    if (existing) {
      console.log(`⚠️  Module already exists with status: ${existing.status}`);
      console.log(`   Would you like to update it? (manually delete first if needed)`);
      return;
    }

    // Register the module
    const module = await prisma.module.create({
      data: {
        name: manifest.name,
        version: manifest.version,
        displayName: manifest.displayName,
        description: manifest.description,
        status: 'REGISTERED',
        manifest: manifest,
        path: path.resolve(__dirname),
      },
    });

    console.log(`✅ Module registered successfully!`);
    console.log(`   ID: ${module.id}`);
    console.log(`   Status: ${module.status}`);
    console.log(`   Path: ${module.path}`);
    console.log('');
    console.log(`Next steps:`);
    console.log(`  1. Install: POST /api/v1/modules/${manifest.name}/install`);
    console.log(`  2. Enable:  POST /api/v1/modules/${manifest.name}/enable`);

  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

registerModule().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
