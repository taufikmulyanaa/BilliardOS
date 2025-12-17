import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const reservationSchema = z.object({
    customerName: z.string(),
    phone: z.string(),
    bookingDate: z.string(), // YYYY-MM-DD
    bookingTime: z.string(), // HH:MM
    pax: z.number(),
    tableType: z.enum(['VIP', 'REGULAR']),
    notes: z.string().optional(),
});

export async function GET() {
    try {
        const reservations = await prisma.reservation.findMany({
            where: {
                // filter by date? for now return upcoming
                bookingDate: { gte: new Date() }
            },
            orderBy: { bookingDate: 'asc' }
        });
        return NextResponse.json({ success: true, data: reservations });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = reservationSchema.parse(body);

        // Parse Date/Time
        const date = new Date(data.bookingDate);
        // Combine date and time string? Or store as separate fields as defined in schema?
        // Schema: bookingDate @db.Date, bookingTime @db.Time
        // Prisma treats DateTime for both.

        // For Time, we need a DateTime object.
        const [hours, minutes] = data.bookingTime.split(':');
        const timeDate = new Date();
        timeDate.setHours(Number(hours), Number(minutes), 0, 0);

        const reservation = await prisma.reservation.create({
            data: {
                customerName: data.customerName,
                phone: data.phone,
                bookingDate: date,
                bookingTime: timeDate,
                pax: data.pax,
                tableType: data.tableType,
                status: 'PENDING',
                notes: data.notes
            }
        });

        return NextResponse.json({ success: true, reservation });
    } catch (error) {
        console.error("Create Reservation Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
