import { PrismaClient, TableType, TableStatus, Role, Tier, MemberStatus, ProductCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Clean up
    try {
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.tableSession.deleteMany();
        await prisma.reservation.deleteMany();
        await prisma.pointTransaction.deleteMany();
        await prisma.member.deleteMany();
        await prisma.product.deleteMany();
        await prisma.table.deleteMany();
        await prisma.user.deleteMany();
    } catch (e) {
        console.log('Cleanup failed or empty', e);
    }

    // 2. Users (Staff)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await prisma.user.create({
        data: {
            username: 'admin',
            fullName: 'Admin Staff',
            role: Role.ADMIN,
            passwordHash,
        },
    });

    console.log('✅ Staff created');

    // 3. Tables
    const tables = [
        { id: 'T01', name: 'Meja 01', type: TableType.VIP, hourlyRate: 50000, status: TableStatus.ACTIVE },
        { id: 'T02', name: 'Meja 02', type: TableType.VIP, hourlyRate: 50000, status: TableStatus.BOOKED },
        { id: 'T03', name: 'Meja 03', type: TableType.REGULAR, hourlyRate: 35000, status: TableStatus.AVAILABLE },
        { id: 'T04', name: 'Meja 04', type: TableType.REGULAR, hourlyRate: 35000, status: TableStatus.AVAILABLE },
        { id: 'T05', name: 'Meja 05', type: TableType.REGULAR, hourlyRate: 35000, status: TableStatus.ACTIVE },
        { id: 'T06', name: 'Meja 06', type: TableType.REGULAR, hourlyRate: 35000, status: TableStatus.CLEANING },
        { id: 'T07', name: 'Meja 07', type: TableType.REGULAR, hourlyRate: 35000, status: TableStatus.AVAILABLE },
        { id: 'T08', name: 'Meja 08', type: TableType.REGULAR, hourlyRate: 35000, status: TableStatus.AVAILABLE },
    ];

    for (const t of tables) {
        await prisma.table.create({ data: t });
    }
    console.log('✅ Tables created');

    // 4. Products (F&B)
    const products = [
        { id: 'F01', name: 'Nasi Goreng Spesial', category: ProductCategory.FOOD, price: 35000, stockQty: 50, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=300&h=300' },
        { id: 'F02', name: 'Mie Goreng Jawa', category: ProductCategory.FOOD, price: 32000, stockQty: 45, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=300&h=300' },
        { id: 'S01', name: 'Chicken Wings (6 pcs)', category: ProductCategory.SNACK, price: 45000, stockQty: 20, imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=300&h=300' },
        { id: 'S02', name: 'French Fries', category: ProductCategory.SNACK, price: 25000, stockQty: 100, imageUrl: 'https://images.unsplash.com/photo-1573080496987-aeb4d91c04aa?auto=format&fit=crop&q=80&w=300&h=300' },
        { id: 'D01', name: 'Es Kopi Susu Gula Aren', category: ProductCategory.DRINK, price: 25000, stockQty: 80, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=300&h=300' },
        { id: 'D02', name: 'Ice Lemon Tea', category: ProductCategory.DRINK, price: 18000, stockQty: 100, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=300&h=300' },
        { id: 'D03', name: 'Coca Cola', category: ProductCategory.DRINK, price: 15000, stockQty: 150, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300&h=300' },
    ];

    for (const p of products) {
        await prisma.product.create({ data: p });
    }
    console.log('✅ Products created');

    // 5. Members
    const members = [
        { memberCode: 'MEM-001', fullName: 'Michael Chen', phone: '08123456789', tier: Tier.GOLD, pointsBalance: 5240 },
        { memberCode: 'MEM-002', fullName: 'Sarah Wijaya', phone: '0818555999', tier: Tier.SILVER, pointsBalance: 1100 },
        { memberCode: 'MEM-003', fullName: 'Budi Santoso', phone: '0813977888', tier: Tier.BRONZE, pointsBalance: 450 },
    ];

    for (const m of members) {
        await prisma.member.create({ data: m });
    }
    console.log('✅ Members created');

    // 6. Active Sessions (T01 & T05) with Orders
    // T01: Active 45 mins - VIP
    const session1 = await prisma.tableSession.create({
        data: {
            tableId: 'T01',
            startTime: new Date(Date.now() - 45 * 60 * 1000),
            customerName: 'Pak Hendra',
            status: 'OPEN',
            pax: 4,
        }
    });

    // Order for T01
    await prisma.order.create({
        data: {
            invoiceNo: 'INV-SEED-001',
            sessionId: session1.id,
            paymentStatus: 'PENDING',
            paymentMethod: 'CASH', // Default for now
            subtotal: 88000,
            taxAmount: 8800,
            totalAmount: 96800,
            items: {
                create: [
                    { productId: 'F01', itemName: 'Nasi Goreng Spesial', unitPrice: 35000, quantity: 2, totalPrice: 70000 },
                    { productId: 'D02', itemName: 'Ice Lemon Tea', unitPrice: 18000, quantity: 1, totalPrice: 18000 },
                ]
            }
        }
    });

    // T05: Active 12 mins - Regular - Walk-in
    const session2 = await prisma.tableSession.create({
        data: {
            tableId: 'T05',
            startTime: new Date(Date.now() - 12 * 60 * 1000),
            customerName: 'Walk-in Guest',
            status: 'OPEN',
            pax: 2,
        }
    });

    // Order for T05
    await prisma.order.create({
        data: {
            invoiceNo: 'INV-SEED-002',
            sessionId: session2.id,
            paymentStatus: 'PENDING',
            paymentMethod: 'CASH',
            subtotal: 30000,
            taxAmount: 3000,
            totalAmount: 33000,
            items: {
                create: [
                    { productId: 'D03', itemName: 'Coca Cola', unitPrice: 15000, quantity: 2, totalPrice: 30000 },
                ]
            }
        }
    });

    console.log('✅ Sessions & Orders created');

    // 7. Reservations & Waiting List
    // We use 'notes' to distinguish Walk-in from Reservation for now

    // Waiting List (Walk-in)
    await prisma.reservation.create({
        data: {
            customerName: 'Andi Saputra',
            phone: '0812999000',
            bookingDate: new Date(),
            bookingTime: new Date(new Date().setHours(19, 45)), // Just showing past time as if waiting
            pax: 3,
            tableType: TableType.REGULAR,
            status: 'PENDING',
            notes: 'WALK-IN',
        }
    });

    await prisma.reservation.create({
        data: {
            customerName: 'Grup Mawar',
            phone: '0811222333',
            bookingDate: new Date(),
            bookingTime: new Date(new Date().setHours(20, 5)),
            pax: 6,
            tableType: TableType.VIP,
            status: 'PENDING',
            notes: 'WALK-IN: VIP Area',
        }
    });

    // Future Reservations
    await prisma.reservation.create({
        data: {
            customerName: 'Sarah Wijaya', // Member
            phone: '0818555999',
            bookingDate: new Date(), // Today later
            bookingTime: new Date(new Date().setHours(21, 0)),
            pax: 4,
            tableType: TableType.VIP,
            assignedTableId: 'T02', // Booked table
            status: 'CONFIRMED',
            notes: 'RESERVATION: Member Request',
        }
    });

    await prisma.reservation.create({
        data: {
            customerName: 'Komunitas Billiard',
            phone: '0813777888',
            bookingDate: new Date(),
            bookingTime: new Date(new Date().setHours(21, 30)),
            pax: 8,
            tableType: TableType.REGULAR,
            status: 'CONFIRMED',
            notes: 'RESERVATION: Need 2 tables',
        }
    });

    console.log('✅ Reservations created');
    console.log('🌱 Seed finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
