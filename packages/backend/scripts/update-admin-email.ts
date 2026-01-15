/**
 * Script to update admin email from old to new branding
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating admin email...');

  // Update the admin user email
  const result = await prisma.user.updateMany({
    where: {
      email: 'admin@nxforge.local',
    },
    data: {
      email: 'admin@nxforge.local',
    },
  });

  console.log(`✅ Updated ${result.count} user(s)`);

  // Verify the update
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@nxforge.local' },
    select: { id: true, email: true, username: true },
  });

  if (adminUser) {
    console.log('✅ Admin user now has email:', adminUser.email);
  } else {
    console.log('⚠️  Could not find admin user with new email');
  }
}

main()
  .catch((e) => {
    console.error('Error updating admin email:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
