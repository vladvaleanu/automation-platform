
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteFailedMigration() {
    try {
        const result = await prisma.moduleMigration.deleteMany({
            where: {
                moduleName: 'documentation-manager',
                filename: '004_add_deleted_at.sql',
                success: false
            }
        });

        console.log('Deleted failed migrations:', result.count);
    } catch (error) {
        console.error('Error deleting migration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteFailedMigration();
