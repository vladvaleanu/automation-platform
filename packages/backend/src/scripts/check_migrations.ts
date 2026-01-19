
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrations() {
    try {
        const migrations = await prisma.moduleMigration.findMany({
            where: { moduleName: 'documentation-manager' }
        });
        console.log('Migrations:', JSON.stringify(migrations, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMigrations();
