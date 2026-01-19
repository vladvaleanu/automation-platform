
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableModule() {
    try {
        const result = await prisma.module.update({
            where: { name: 'documentation-manager' },
            data: {
                status: 'ENABLED',
                enabledAt: new Date(),
                disabledAt: null
            }
        });

        console.log('Module updated:', result);
    } catch (error) {
        console.error('Error updating module:', error);
    } finally {
        await prisma.$disconnect();
    }
}

enableModule();
