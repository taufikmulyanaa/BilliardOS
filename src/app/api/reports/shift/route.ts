import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession(request);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = Number(session.id);

        // 1. Find Open Shift
        const openShift = await prisma.shiftReport.findFirst({
            where: {
                staffId: userId,
                // @ts-ignore
                closedAt: null
            },
            orderBy: { openedAt: 'desc' }
        });

        if (!openShift) {
            return NextResponse.json({
                status: 'CLOSED',
                message: 'No active shift found.'
            });
        }

        // 2. Aggregate Sales since OpenedAt
        // Only count orders handled by this staff? Or all checks?
        // Usually a POS tracks "Drawer" sales. If this is a single Drawer system, maybe all sales.
        // Schema doesn't link Order to specific Staff (Author), only to Member/Session.
        // If multiple cashiers share a machine, they share the drawer.
        // Let's assume ALL orders created after openedAt are part of this shift for now.

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: openShift.openedAt },
                paymentStatus: 'PAID'
            }
        });

        let cashSales = 0;
        let nonCashSales = 0;

        orders.forEach(o => {
            const amount = Number(o.totalAmount);
            if (o.paymentMethod === 'CASH') {
                cashSales += amount;
            } else {
                nonCashSales += amount;
            }
        });

        const totalSales = cashSales + nonCashSales;
        const systemCash = Number(openShift.openingCash) + cashSales;

        return NextResponse.json({
            status: 'OPEN',
            data: {
                shiftId: openShift.id,
                openedAt: openShift.openedAt,
                openingCash: Number(openShift.openingCash),
                cashSales,
                nonCashSales,
                totalSales,
                systemCash // Expected Cash in Drawer
            }
        });

    } catch (error) {
        console.error("Get Shift error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
