import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    assignedTableId: z.string().optional(),
    notes: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
    request: Request,
    context: RouteContext
) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await request.json();
        const data = updateSchema.parse(body);

        const reservation = await prisma.reservation.update({
            where: { id },
            data
        });

        return NextResponse.json({ success: true, data: reservation });
    } catch (error) {
        console.error("Update Reservation Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: RouteContext
) {
    try {
        const params = await context.params;
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Soft cancel instead of hard delete
        const reservation = await prisma.reservation.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        return NextResponse.json({ success: true, data: reservation });
    } catch (error) {
        console.error("Cancel Reservation Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
