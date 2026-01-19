/**
 * Register AI Copilot module in the database
 * Run with: npx tsx prisma/register-ai-copilot.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Registering ai-copilot module...');

    // Read manifest
    const manifestPath = path.join(process.cwd(), '..', '..', 'modules', 'ai-copilot', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const modulePath = path.join(process.cwd(), '..', '..', 'modules', 'ai-copilot');

    // Upsert module record
    const module = await prisma.module.upsert({
        where: { name: 'ai-copilot' },
        update: {
            version: manifest.version,
            displayName: manifest.displayName,
            description: manifest.description,
            author: manifest.author,
            manifest: manifest,
            status: 'ENABLED',
            enabledAt: new Date(),
            path: modulePath,
        },
        create: {
            name: 'ai-copilot',
            version: manifest.version,
            displayName: manifest.displayName,
            description: manifest.description,
            author: manifest.author,
            manifest: manifest,
            status: 'ENABLED',
            enabledAt: new Date(),
            installedAt: new Date(),
            path: modulePath,
        },
    });

    console.log('✅ Registered ai-copilot module:', {
        id: module.id,
        name: module.name,
        status: module.status,
    });
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
