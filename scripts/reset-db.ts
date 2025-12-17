import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting database cleanup...');

        // 1. Delete transactional data (dependents first)
        console.log('Deleting OrderItems...');
        await prisma.orderItem.deleteMany({});

        console.log('Deleting Orders...');
        await prisma.order.deleteMany({});

        console.log('Deleting TableSessions...');
        await prisma.tableSession.deleteMany({});

        console.log('Deleting Reservations...');
        await prisma.reservation.deleteMany({});

        console.log('Deleting ShiftReports...');
        await prisma.shiftReport.deleteMany({});

        console.log('Deleting StockAdjustments...');
        await prisma.stockAdjustment.deleteMany({});

        console.log('Deleting PointTransactions...');
        await prisma.pointTransaction.deleteMany({});

        console.log('Deleting WalletTransactions...');
        await prisma.walletTransaction.deleteMany({});

        console.log('Deleting Promos...');
        await prisma.promo.deleteMany({});

        // 2. Delete business config? User said "semua data".
        console.log('Deleting BusinessConfig...');
        await prisma.businessConfig.deleteMany({});

        // 3. Delete master data (Members, Products, Tables)
        // Keep Tables? "hapus semua data". I'll delete them.
        console.log('Deleting Members...');
        await prisma.member.deleteMany({});

        console.log('Deleting Products...');
        await prisma.product.deleteMany({});

        console.log('Deleting Tables...');
        await prisma.table.deleteMany({});

        // 4. Users
        // User requested to keep cashier, manager, and admin.
        // Since only these roles exist in schema, we effectively keep ALL users.
        // If there were other roles, we would delete them here.
        // await prisma.user.deleteMany({
        //   where: {
        //     role: {
        //       notIn: ['ADMIN', 'MANAGER', 'CASHIER']
        //     }
        //   }
        // });
        console.log('Skipping User deletion (Keeping ADMIN, MANAGER, CASHIER accounts)...');

        console.log('Database cleanup completed successfully.');
    } catch (error) {
        console.error('Error cleaning database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
