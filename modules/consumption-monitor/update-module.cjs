/**
 * Update consumption-monitor module registration
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateModule() {
  try {
    // Read manifest
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    console.log('📦 Updating module registration...');
    console.log(`   Module: ${manifest.name}`);
    console.log(`   Version: ${manifest.version}`);
    console.log(`   Entry: ${manifest.entry}`);
    console.log(`   Routes: ${manifest.routes.length}`);
    console.log(`   Jobs: ${Object.keys(manifest.jobs).length}`);
    console.log('');

    // Update the module
    const updated = await prisma.module.update({
      where: { name: 'consumption-monitor' },
      data: {
        version: manifest.version,
        displayName: manifest.displayName,
        description: manifest.description,
        manifest: manifest,
        path: path.resolve(__dirname),
        status: 'ENABLED',
        enabledAt: new Date(),
      },
    });

    console.log('✅ Module updated successfully!');
    console.log(`   Status: ${updated.status}`);
    console.log(`   Path: ${updated.path}`);
    console.log(`   Manifest routes: ${updated.manifest.routes?.length || 0}`);

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateModule().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
