const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const module = await prisma.module.findUnique({
    where: { name: 'consumption-monitor' }
  });
  
  console.log('Module status:', module?.status);
  console.log('Status type:', typeof module?.status);
  console.log('Exact match "ENABLED":', module?.status === 'ENABLED');
  
  await prisma.$disconnect();
}

verify();
