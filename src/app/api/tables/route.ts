import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createTableSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['REGULAR', 'VIP']),
    hourlyRate: z.number().min(0),
});

export async function GET() {
    try {
        // Fetch tables with active sessions
        const tables = await prisma.table.findMany({
            include: {
                sessions: {
                    where: {
                        OR: [
                            { status: "OPEN" },
                            { status: "PAUSED" }
                        ]
                    },
                    take: 1,
                    include: {
                        member: { select: { fullName: true, memberCode: true } },
                        orders: {
                            include: { items: true }
                        }
                    }
                },
            },
            orderBy: { id: "asc" },
        });

        const formattedTables = tables.map((table) => {
            const activeSession = table.sessions[0];

            let currentBill = 0;
            let durationMinutes = 0;

            if (activeSession) {
                const start = new Date(activeSession.startTime).getTime();
                const now = new Date().getTime();
                durationMinutes = Math.floor((now - start) / (1000 * 60));

                // Calculate Bill: (Duration / 60) * HourlyRate
                const hours = durationMinutes / 60;
                currentBill = Math.ceil(hours * Number(table.hourlyRate));
            }

            return {
                id: table.id,
                name: table.name,
                type: table.type,
                status: table.status,
                hourlyRate: Number(table.hourlyRate),
                // Flatten billing data for frontend
                duration: durationMinutes,
                currentBill,
                activeSession: activeSession ? {
                    id: activeSession.id,
                    customerName: activeSession.customerName || activeSession.member?.fullName || "Guest",
                    member: activeSession.member,
                    startTime: activeSession.startTime,
                    endTime: (activeSession as any).endTime || null, // For fixed hour packages
                    status: activeSession.status,
                    durationMinutes,
                    currentBill,
                    orders: activeSession.orders || []
                } : null
            };
        });

        return NextResponse.json({ success: true, data: formattedTables });
    } catch (error) {
        console.error("Get tables error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// CREATE new table
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, name, type, hourlyRate } = createTableSchema.parse(body);

        // Check if table ID exists
        const existing = await prisma.table.findUnique({ where: { id } });
        if (existing) {
            return NextResponse.json({ error: "Table ID already exists" }, { status: 400 });
        }

        const table = await prisma.table.create({
            data: {
                id,
                name,
                type,
                hourlyRate,
                status: 'AVAILABLE',
            },
        });

        return NextResponse.json({ success: true, data: table }, { status: 201 });
    } catch (error) {
        console.error("Create table error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
