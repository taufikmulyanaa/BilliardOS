import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        // Default to today
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all orders for the day
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                paymentStatus: 'PAID',
            },
            include: {
                items: {
                    include: {
                        product: { select: { name: true, category: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Calculate totals
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const totalOrders = orders.length;
        const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        // Revenue by hour
        const hourlyRevenue: Record<number, number> = {};
        for (let h = 0; h < 24; h++) hourlyRevenue[h] = 0;

        orders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hourlyRevenue[hour] += Number(order.totalAmount);
        });

        // Payment method breakdown
        const paymentBreakdown: Record<string, { count: number; amount: number }> = {};
        orders.forEach(order => {
            const method = order.paymentMethod;
            if (!paymentBreakdown[method]) {
                paymentBreakdown[method] = { count: 0, amount: 0 };
            }
            paymentBreakdown[method].count++;
            paymentBreakdown[method].amount += Number(order.totalAmount);
        });

        // Top products
        const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.productId || item.itemName;
                if (!productSales[key]) {
                    productSales[key] = { name: item.itemName, qty: 0, revenue: 0 };
                }
                productSales[key].qty += item.quantity;
                productSales[key].revenue += Number(item.totalPrice);
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Table sessions today
        const sessions = await prisma.tableSession.findMany({
            where: {
                startTime: { gte: startOfDay, lte: endOfDay },
                status: 'CLOSED',
            },
            include: {
                table: { select: { name: true } }
            }
        });

        const tableBillRevenue = sessions.reduce((sum, s) => sum + Number(s.totalCost || 0), 0);
        const totalPlayMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

        return NextResponse.json({
            success: true,
            data: {
                date: targetDate.toISOString().split('T')[0],
                summary: {
                    totalRevenue,
                    totalOrders,
                    avgTicket,
                    tableBillRevenue,
                    totalPlayHours: Math.round(totalPlayMinutes / 60 * 10) / 10,
                    sessionsCompleted: sessions.length,
                },
                hourlyRevenue: Object.entries(hourlyRevenue).map(([hour, amount]) => ({
                    hour: parseInt(hour),
                    amount,
                })),
                paymentBreakdown: Object.entries(paymentBreakdown).map(([method, data]) => ({
                    method,
                    ...data,
                })),
                topProducts,
            }
        });
    } catch (error) {
        console.error("Daily report error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
