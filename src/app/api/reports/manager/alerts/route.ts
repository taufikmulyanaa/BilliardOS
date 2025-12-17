import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const alerts = [];

        // Check low stock products (stock < 10)
        const lowStockProducts = await prisma.product.findMany({
            where: { stockQty: { lt: 10 }, isActive: true }
        });
        if (lowStockProducts.length > 0) {
            alerts.push({
                type: 'warning',
                title: 'Stok Rendah',
                description: `${lowStockProducts.length} produk memiliki stok dibawah minimum`,
                time: 'Sekarang'
            });
        }

        // Check upcoming reservations (next 2 hours)
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingReservations = await prisma.reservation.count({
            where: {
                bookingDate: today,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });
        if (upcomingReservations > 0) {
            alerts.push({
                type: 'info',
                title: 'Reservasi Mendatang',
                description: `${upcomingReservations} reservasi hari ini`,
                time: '30 menit lalu'
            });
        }

        // Check shift variance (any unclosed shifts)
        const openShifts = await prisma.shiftReport.findMany({
            where: { closedAt: null },
            include: { staff: true }
        });
        if (openShifts.length > 0) {
            alerts.push({
                type: 'info',
                title: 'Shift Aktif',
                description: `${openShifts.length} shift sedang berjalan`,
                time: 'Sekarang'
            });
        }

        return NextResponse.json({ success: true, data: alerts });
    } catch (error) {
        console.error('Alerts error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
    }
}
