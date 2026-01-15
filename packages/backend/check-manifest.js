const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkManifest() {
  const module = await prisma.module.findUnique({
    where: { name: 'consumption-monitor' },
    select: { 
      id: true,
      name: true, 
      status: true,
      manifest: true 
    }
  });
  
  if (module) {
    console.log('Module found:', module.name);
    console.log('Status:', module.status);
    console.log('Has manifest:', !!module.manifest);
    console.log('Has UI section:', !!module.manifest?.ui);
    console.log('Has sidebar config:', !!module.manifest?.ui?.sidebar);
    console.log('\nSidebar config:', JSON.stringify(module.manifest?.ui?.sidebar, null, 2));
  } else {
    console.log('Module not found');
  }
  
  await prisma.$disconnect();
}

checkManifest().catch(console.error);
