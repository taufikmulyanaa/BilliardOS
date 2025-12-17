import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTableSchema = z.object({
    name: z.string().optional(),
    type: z.enum(['REGULAR', 'VIP']).optional(),
    hourlyRate: z.number().optional(),
    status: z.enum(['AVAILABLE', 'ACTIVE', 'BOOKED', 'CLEANING']).optional(),
});

// GET single table
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tableId = (await params).id;

        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: {
                sessions: {
                    orderBy: { startTime: 'desc' },
                    take: 10,
                },
                reservations: {
                    where: { status: { in: ['PENDING', 'CONFIRMED'] } },
                    orderBy: { bookingDate: 'asc' },
                }
            }
        });

        if (!table) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: table });
    } catch (error) {
        console.error("Get table error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// UPDATE table
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tableId = (await params).id;
        const body = await request.json();
        const data = updateTableSchema.parse(body);

        const table = await prisma.table.update({
            where: { id: tableId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.type && { type: data.type }),
                ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
                ...(data.status && { status: data.status }),
            },
        });

        return NextResponse.json({ success: true, data: table });
    } catch (error) {
        console.error("Update table error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE table
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tableId = (await params).id;

        // Check if table has active sessions
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: { sessions: { where: { status: 'OPEN' } } }
        });

        if (table?.sessions.length) {
            return NextResponse.json({ error: "Cannot delete table with active session" }, { status: 400 });
        }

        await prisma.table.delete({
            where: { id: tableId },
        });

        return NextResponse.json({ success: true, message: "Table deleted" });
    } catch (error) {
        console.error("Delete table error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
