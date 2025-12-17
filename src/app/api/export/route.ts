import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'transactions';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let data: any[] = [];
        let filename = '';

        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59');

        switch (type) {
            case 'transactions':
                const orders = await prisma.order.findMany({
                    where: startDate || endDate ? { createdAt: dateFilter } : undefined,
                    include: {
                        items: { include: { product: true } },
                        member: { select: { fullName: true, memberCode: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                data = orders.map((o) => ({
                    'Invoice': o.invoiceNo,
                    'Tanggal': new Date(o.createdAt).toLocaleString('id-ID'),
                    'Customer': o.member?.fullName || o.customerName || 'Walk-in',
                    'Items': o.items.map((i) => `${i.itemName} x${i.quantity}`).join('; '),
                    'Subtotal': Number(o.subtotal),
                    'Discount': Number(o.discountAmount),
                    'Tax': Number(o.taxAmount),
                    'Total': Number(o.totalAmount),
                    'Payment': o.paymentMethod,
                    'Status': o.paymentStatus,
                }));
                filename = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            case 'members':
                const members = await prisma.member.findMany({
                    orderBy: { joinDate: 'desc' },
                });

                data = members.map((m) => ({
                    'Kode Member': m.memberCode,
                    'Nama': m.fullName,
                    'Phone': m.phone,
                    'Tier': m.tier,
                    'Poin': m.pointsBalance,
                    'Saldo Wallet': Number(m.walletBalance),
                    'Tanggal Bergabung': new Date(m.joinDate).toLocaleDateString('id-ID'),
                    'Status': m.status,
                    'Kunjungan Terakhir': m.lastVisitAt ? new Date(m.lastVisitAt).toLocaleString('id-ID') : '-',
                }));
                filename = `members_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            case 'inventory':
                const products = await prisma.product.findMany({
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                });

                data = products.map((p) => ({
                    'ID': p.id,
                    'Nama': p.name,
                    'Kategori': p.category,
                    'Harga': Number(p.price),
                    'Stok': p.stockQty,
                    'Nilai Stok': Number(p.price) * p.stockQty,
                    'Status': p.isActive ? 'Aktif' : 'Non-Aktif',
                }));
                filename = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            case 'shifts':
                const shifts = await prisma.shiftReport.findMany({
                    where: startDate || endDate ? { openedAt: dateFilter } : undefined,
                    include: { staff: { select: { fullName: true } } },
                    orderBy: { openedAt: 'desc' },
                });

                data = shifts.map((s) => ({
                    'Staff': s.staff.fullName,
                    'Waktu Buka': new Date(s.openedAt).toLocaleString('id-ID'),
                    'Waktu Tutup': s.closedAt ? new Date(s.closedAt).toLocaleString('id-ID') : '-',
                    'Kas Awal': Number(s.openingCash),
                    'Kas Sistem': Number(s.systemCash),
                    'Kas Aktual': Number(s.actualCash),
                    'Variance': Number(s.variance),
                    'Alasan': s.varianceReason || '-',
                }));
                filename = `shifts_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            default:
                return NextResponse.json({ success: false, error: 'Invalid export type' }, { status: 400 });
        }

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Return as downloadable file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ success: false, error: 'Failed to export data' }, { status: 500 });
    }
}
