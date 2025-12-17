import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// POST: Reset table statuses - set BOOKED tables to AVAILABLE if no active reservation
export async function POST() {
    try {
        // Find all tables with BOOKED status
        const bookedTables = await prisma.table.findMany({
            where: { status: 'BOOKED' }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let resetCount = 0;

        for (const table of bookedTables) {
            // Check if there's an active reservation for this table
            const activeReservation = await prisma.reservation.findFirst({
                where: {
                    status: 'CONFIRMED',
                    tableType: table.tableType,
                    bookingDate: {
                        gte: today
                    }
                }
            });

            // If no active reservation, reset to AVAILABLE
            if (!activeReservation) {
                await prisma.table.update({
                    where: { id: table.id },
                    data: { status: 'AVAILABLE' }
                });
                resetCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Reset ${resetCount} table(s) from BOOKED to AVAILABLE`,
            resetCount
        });

    } catch (error) {
        console.error("Reset Table Status Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
