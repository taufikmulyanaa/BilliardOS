import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tableId = (await params).id;

        // Find active session
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: {
                sessions: {
                    where: { status: "OPEN" },
                    orderBy: { startTime: "desc" },
                    take: 1,
                },
            },
        });

        if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

        const activeSession = table.sessions[0];
        if (!activeSession) {
            return NextResponse.json({ error: "No active session found" }, { status: 400 });
        }

        // Calculate Duration and Cost
        const endTime = new Date();
        const startTime = new Date(activeSession.startTime);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60)); // Round down or up? Usually minutes.

        // Cost
        const hours = durationMinutes / 60;
        const totalCost = Math.ceil(hours * Number(table.hourlyRate));

        // Update Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Close Session
            const updatedSession = await tx.tableSession.update({
                where: { id: activeSession.id },
                data: {
                    endTime,
                    durationMinutes,
                    totalCost,
                    status: "CLOSED", // or PAID if auto-paid? Default to CLOSED (Pending Payment)
                },
            });

            // 2. Update Table Status
            await tx.table.update({
                where: { id: tableId },
                data: { status: "AVAILABLE" }, // Ready for next customer? Or CLEANING? Let's say AVAILABLE for MVP.
            });

            return updatedSession;
        });

        return NextResponse.json({
            success: true,
            message: "Session stopped",
            data: {
                sessionId: result.id,
                durationMinutes,
                totalCost,
                startTime,
                endTime
            }
        });

    } catch (error) {
        console.error("Stop session error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
