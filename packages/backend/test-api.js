const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
  console.log('Testing different query approaches:\n');
  
  // Test 1: Find by name
  const byName = await prisma.module.findUnique({
    where: { name: 'consumption-monitor' }
  });
  console.log('1. Find by name:', !!byName, byName?.status);
  
  // Test 2: Find many with status filter
  const withStatus = await prisma.module.findMany({
    where: { status: 'ENABLED' }
  });
  console.log('2. Find many with status ENABLED:', withStatus.length, 'modules');
  withStatus.forEach(m => console.log('   -', m.name, m.status));
  
  // Test 3: Find all
  const all = await prisma.module.findMany();
  console.log('3. Find all modules:', all.length, 'modules');
  all.forEach(m => console.log('   -', m.name, m.status));
  
  // Test 4: Check the exact status value
  const cm = await prisma.module.findUnique({
    where: { name: 'consumption-monitor' }
  });
  if (cm) {
    console.log('\n4. Consumption monitor details:');
    console.log('   Status:', JSON.stringify(cm.status));
    console.log('   Status === "ENABLED":', cm.status === 'ENABLED');
    console.log('   Status type:', typeof cm.status);
  }
  
  await prisma.$disconnect();
}

testQuery();
