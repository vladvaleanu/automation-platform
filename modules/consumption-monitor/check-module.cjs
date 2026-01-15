/**
 * Check module registration details
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModule() {
  try {
    const module = await prisma.module.findUnique({
      where: { name: 'consumption-monitor' },
    });

    if (!module) {
      console.log('❌ Module not found');
      return;
    }

    console.log('📦 Module Details:');
    console.log(`   ID: ${module.id}`);
    console.log(`   Name: ${module.name}`);
    console.log(`   Version: ${module.version}`);
    console.log(`   Status: ${module.status}`);
    console.log(`   Path: ${module.path || '(not set)'}`);
    console.log(`   Entry: ${module.manifest?.entry || '(not set)'}`);
    console.log('');
    console.log('📝 Manifest routes:', JSON.stringify(module.manifest?.routes, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkModule().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
