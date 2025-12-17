import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tableId = (await params).id;

        // Find table with active session
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: {
                sessions: {
                    where: {
                        OR: [
                            { status: "OPEN" },
                            { status: "PAUSED" }
                        ]
                    },
                    orderBy: { startTime: "desc" },
                    take: 1,
                },
            },
        });

        if (!table) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        const activeSession = table.sessions[0];
        if (!activeSession) {
            return NextResponse.json({ error: "No active session found" }, { status: 400 });
        }

        // Toggle pause/resume
        const newStatus = activeSession.status === "OPEN" ? "PAUSED" : "OPEN";
        const newTableStatus = newStatus === "PAUSED" ? "BOOKED" : "ACTIVE"; // BOOKED shows yellow for paused

        // Update session status
        await prisma.$transaction(async (tx) => {
            await tx.tableSession.update({
                where: { id: activeSession.id },
                data: { status: newStatus }
            });

            await tx.table.update({
                where: { id: tableId },
                data: { status: newTableStatus }
            });
        });

        return NextResponse.json({
            success: true,
            message: newStatus === "PAUSED" ? "Session paused" : "Session resumed",
            status: newStatus
        });

    } catch (error) {
        console.error("Pause/Resume session error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
