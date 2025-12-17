import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Order } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get last 7 days revenue
        const days = [];
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: date, lt: nextDate },
                    paymentStatus: 'PAID'
                }
            });

            const revenue = orders.reduce((sum: number, order: Order) => sum + Number(order.totalAmount), 0);
            const sessions = await prisma.tableSession.count({
                where: {
                    startTime: { gte: date, lt: nextDate }
                }
            });

            days.push({
                name: dayNames[date.getDay()],
                date: date.toISOString().split('T')[0],
                revenue,
                sessions
            });
        }

        return NextResponse.json({ success: true, data: days });
    } catch (error) {
        console.error('Revenue trend error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch revenue trend' }, { status: 500 });
    }
}
