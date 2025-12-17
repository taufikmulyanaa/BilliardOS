import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Order } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's revenue
        const todayOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                paymentStatus: 'PAID'
            }
        });
        const todayRevenue = todayOrders.reduce((sum: number, order: Order) => sum + Number(order.totalAmount), 0);

        // Get yesterday's revenue for comparison
        const yesterdayOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: yesterday, lt: today },
                paymentStatus: 'PAID'
            }
        });
        const yesterdayRevenue = yesterdayOrders.reduce((sum: number, order: Order) => sum + Number(order.totalAmount), 0);
        const revenueChange = yesterdayRevenue > 0
            ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
            : 0;

        // Transaction count
        const todayTransactions = todayOrders.length;
        const yesterdayTransactions = yesterdayOrders.length;
        const transactionsChange = yesterdayTransactions > 0
            ? ((todayTransactions - yesterdayTransactions) / yesterdayTransactions * 100).toFixed(1)
            : 0;

        // Occupancy rate (active tables / total tables)
        const totalTables = await prisma.table.count();
        const activeTables = await prisma.table.count({ where: { status: 'ACTIVE' } });
        const occupancyRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;

        // Active members
        const activeMembers = await prisma.member.count({ where: { status: 'ACTIVE' } });

        // Members this month vs last month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const newMembersThisMonth = await prisma.member.count({
            where: { joinDate: { gte: startOfMonth } }
        });
        const newMembersLastMonth = await prisma.member.count({
            where: { joinDate: { gte: startOfLastMonth, lt: startOfMonth } }
        });
        const membersChange = newMembersLastMonth > 0
            ? ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth * 100).toFixed(1)
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                todayRevenue,
                todayRevenueChange: Number(revenueChange),
                totalTransactions: todayTransactions,
                transactionsChange: Number(transactionsChange),
                occupancyRate,
                occupancyChange: 0, // Would need historical data
                activeMembers,
                membersChange: Number(membersChange),
            }
        });
    } catch (error) {
        console.error('Manager stats error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
