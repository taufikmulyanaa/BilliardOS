import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const startSessionSchema = z.object({
    customerName: z.string().optional(),
    memberId: z.number().optional(),
    billingType: z.union([z.literal('open'), z.number()]).optional(), // 'open' or fixed hours (1-5)
    fixedHours: z.number().optional(),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tableId = (await params).id;
        const body = await request.json();
        const { customerName, memberId, billingType, fixedHours } = startSessionSchema.parse(body);

        // Check if table exists and is available
        const table = await prisma.table.findUnique({
            where: { id: tableId },
        });

        if (!table) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        if (table.status !== "AVAILABLE") {
            return NextResponse.json({ error: "Table is not available" }, { status: 400 });
        }

        const startTime = new Date();

        // Calculate endTime for fixed hour packages
        let endTime: Date | null = null;
        if (typeof billingType === 'number' || fixedHours) {
            const hours = fixedHours || (typeof billingType === 'number' ? billingType : 0);
            if (hours > 0) {
                endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
            }
        }

        // Start Transaction: Create Session + Update Table Status
        const session = await prisma.$transaction(async (tx) => {
            // 1. Update Table Status
            await tx.table.update({
                where: { id: tableId },
                data: { status: "ACTIVE" },
            });

            // 2. Create Session with optional endTime for fixed packages
            return await tx.tableSession.create({
                data: {
                    tableId,
                    customerName: customerName || "Guest",
                    memberId,
                    status: "OPEN",
                    startTime,
                    endTime, // Will be null for 'open' billing
                },
            });
        });

        return NextResponse.json({
            success: true,
            session: {
                ...session,
                billingType: billingType || 'open',
                fixedHours: fixedHours || null
            }
        });
    } catch (error) {
        console.error("Start session error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
