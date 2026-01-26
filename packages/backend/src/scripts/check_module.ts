
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModule() {
    try {
        const docManager = await prisma.module.findUnique({
            where: { name: 'documentation-manager' },
            select: {
                name: true,
                status: true,
                manifest: true,
                enabledAt: true,
                disabledAt: true
            }
        });

        if (docManager) {
            console.log('Status:', docManager.status);
            if (docManager.manifest && typeof docManager.manifest === 'object' && !Array.isArray(docManager.manifest)) {
                const manifest = docManager.manifest as { jobs?: unknown };
                console.log('Manifest Jobs:', JSON.stringify(manifest.jobs, null, 2));
            }
        } else {
            console.log('Module NOT FOUND');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkModule();
