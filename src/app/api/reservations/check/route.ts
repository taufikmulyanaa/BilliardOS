import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Check for upcoming reservations that need notification or auto-cancel
export async function GET() {
    try {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all CONFIRMED reservations for today
        const reservations = await prisma.reservation.findMany({
            where: {
                status: 'CONFIRMED',
                bookingDate: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        const alerts: any[] = [];
        const toCancel: number[] = [];

        for (const res of reservations) {
            // Combine bookingDate and bookingTime to get full datetime
            const bookingDateTime = new Date(res.bookingDate);
            const bookingTime = new Date(res.bookingTime);
            bookingDateTime.setHours(bookingTime.getHours(), bookingTime.getMinutes(), 0, 0);

            const timeDiff = bookingDateTime.getTime() - now.getTime();
            const minutesDiff = timeDiff / (60 * 1000);

            // Check if within 5 minutes of start time (but not past)
            if (minutesDiff > 0 && minutesDiff <= 5) {
                alerts.push({
                    type: 'upcoming',
                    reservation: res,
                    message: `Booking ${res.customerName} akan dimulai dalam ${Math.ceil(minutesDiff)} menit!`,
                    minutesUntilStart: Math.ceil(minutesDiff)
                });
            }

            // Check if booking time has passed and needs confirmation
            if (minutesDiff <= 0 && minutesDiff > -15) {
                alerts.push({
                    type: 'waiting_confirmation',
                    reservation: res,
                    message: `Booking ${res.customerName} sudah waktunya! Menunggu konfirmasi kasir.`,
                    minutesPast: Math.abs(Math.floor(minutesDiff))
                });
            }

            // Check if 15+ minutes past booking time - auto cancel
            if (minutesDiff <= -15) {
                toCancel.push(res.id);
            }
        }

        // Auto-cancel no-shows
        if (toCancel.length > 0) {
            await prisma.reservation.updateMany({
                where: { id: { in: toCancel } },
                data: { status: 'CANCELLED' }
            });

            // Add cancel notifications
            for (const id of toCancel) {
                const res = reservations.find(r => r.id === id);
                if (res) {
                    alerts.push({
                        type: 'auto_cancelled',
                        reservationId: id,
                        message: `Booking ${res.customerName} otomatis dibatalkan (no-show).`
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            alerts,
            cancelledCount: toCancel.length
        });
    } catch (error) {
        console.error("Check Reservations Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
