/**
 * Script to register the consumption monitor module in the database
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Registering consumption monitor module...');

  // Read the manifest file
  const manifestPath = path.join(__dirname, '../data/modules/consumption-monitor/manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);

  // Register or update the module
  const module = await prisma.module.upsert({
    where: { name: 'consumption-monitor' },
    update: {
      displayName: manifest.displayName,
      description: manifest.description,
      version: manifest.version,
      author: manifest.author,
      manifest: manifest,
      status: 'ENABLED',
      enabledAt: new Date(),
    },
    create: {
      name: 'consumption-monitor',
      displayName: manifest.displayName,
      description: manifest.description,
      version: manifest.version,
      author: manifest.author,
      path: 'data/modules/consumption-monitor',
      manifest: manifest,
      status: 'ENABLED',
      installedAt: new Date(),
      enabledAt: new Date(),
    },
  });

  console.log('✅ Consumption monitor module registered:');
  console.log(JSON.stringify({
    id: module.id,
    name: module.name,
    displayName: module.displayName,
    version: module.version,
    status: module.status,
  }, null, 2));

  console.log('\n🎉 Module registration completed!');
}

main()
  .catch((e) => {
    console.error('Error registering module:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
