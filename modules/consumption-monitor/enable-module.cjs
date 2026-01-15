/**
 * Enable consumption-monitor module
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableModule() {
  try {
    console.log('🔄 Enabling consumption-monitor module...');

    // Get the module
    const module = await prisma.module.findUnique({
      where: { name: 'consumption-monitor' },
    });

    if (!module) {
      console.error('❌ Module not found. Please register it first.');
      process.exit(1);
    }

    console.log(`   Current status: ${module.status}`);

    // Update to ENABLED status
    const updated = await prisma.module.update({
      where: { name: 'consumption-monitor' },
      data: {
        status: 'ENABLED',
        enabledAt: new Date(),
      },
    });

    console.log('✅ Module enabled successfully!');
    console.log(`   Status: ${updated.status}`);
    console.log(`   Enabled at: ${updated.enabledAt}`);
    console.log('');
    console.log('Next: Restart the backend server to load the module');

  } catch (error) {
    console.error('❌ Failed to enable module:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enableModule().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
