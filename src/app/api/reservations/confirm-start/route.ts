import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// POST: Confirm and start a reservation - creates table session and starts billing
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reservationId, tableId } = body;

        if (!reservationId || !tableId) {
            return NextResponse.json(
                { error: "reservationId and tableId are required" },
                { status: 400 }
            );
        }

        // Get the reservation
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId }
        });

        if (!reservation) {
            return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }

        if (reservation.status !== 'CONFIRMED') {
            return NextResponse.json(
                { error: "Reservation is not in CONFIRMED status" },
                { status: 400 }
            );
        }

        // Get the table
        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        if (table.status !== 'BOOKED' && table.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: "Table is not available or booked for this reservation" },
                { status: 400 }
            );
        }

        // Start transaction to update reservation, table, and create session
        const result = await prisma.$transaction(async (tx) => {
            // Update reservation status to COMPLETED
            await tx.reservation.update({
                where: { id: reservationId },
                data: { status: 'COMPLETED' }
            });

            // Create table session
            const session = await tx.tableSession.create({
                data: {
                    tableId: tableId,
                    customerName: reservation.customerName,
                    startTime: new Date(),
                    status: 'OPEN'
                }
            });

            // Update table status to ACTIVE
            await tx.table.update({
                where: { id: tableId },
                data: { status: 'ACTIVE' }
            });

            return session;
        });

        return NextResponse.json({
            success: true,
            message: `Booking ${reservation.customerName} started! Billing dimulai.`,
            session: result
        });

    } catch (error) {
        console.error("Confirm Start Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
