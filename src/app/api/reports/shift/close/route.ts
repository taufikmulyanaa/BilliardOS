import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const closeShiftSchema = z.object({
    shiftId: z.number(),
    actualCash: z.number(),
    varianceReason: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const session = await getSession(request);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { shiftId, actualCash, varianceReason } = closeShiftSchema.parse(body);

        const shift = await prisma.shiftReport.findUnique({
            where: { id: shiftId }
        });

        if (!shift || shift.closedAt) {
            return NextResponse.json({ error: "Invalid shift or already closed" }, { status: 400 });
        }

        // Recalculate System Cash (Backend validation logic same as GET)
        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: shift.openedAt },
                paymentStatus: 'PAID',
                paymentMethod: 'CASH'
            }
        });

        const cashSales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const systemCash = Number(shift.openingCash) + cashSales;
        const variance = actualCash - systemCash;

        // Update Shift
        const closedShift = await prisma.shiftReport.update({
            where: { id: shiftId },
            data: {
                closedAt: new Date(),
                systemCash,
                actualCash,
                variance,
                varianceReason
            }
        });

        return NextResponse.json({ success: true, data: closedShift });

    } catch (error) {
        console.error("Close Shift error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
