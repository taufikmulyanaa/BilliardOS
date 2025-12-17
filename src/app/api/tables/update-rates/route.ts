import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateRateSchema = z.object({
    type: z.enum(['VIP', 'REGULAR', 'SNOOKER']),
    rate: z.number().min(0),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, rate } = updateRateSchema.parse(body);

        // Update all tables of the specified type
        const result = await prisma.table.updateMany({
            where: {
                type: type as any // Cast because Zod enum matches Prisma enum string
            },
            data: {
                hourlyRate: rate
            }
        });

        return NextResponse.json({
            success: true,
            message: `Updated ${result.count} ${type} tables to Rp ${rate.toLocaleString()}`,
            count: result.count
        });

    } catch (error) {
        console.error("Update Rates Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
