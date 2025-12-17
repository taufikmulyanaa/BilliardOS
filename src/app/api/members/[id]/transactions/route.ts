import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const memberId = parseInt((await params).id);
        if (isNaN(memberId)) {
            return NextResponse.json({ error: "Invalid Member ID" }, { status: 400 });
        }

        // 1. Fetch Orders (Purchases)
        const orders = await prisma.order.findMany({
            where: { memberId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit for performance
        });

        // 2. Fetch Wallet Transactions (Topups, Adjustments, etc.)
        // Exclude USAGE because it corresponds to an Order which is already fetched
        const walletTx = await prisma.walletTransaction.findMany({
            where: {
                memberId,
                type: { not: 'USAGE' }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // 3. Combine and Normalize
        const history = [
            ...orders.map(o => ({
                id: `ORD-${o.id}`,
                date: o.createdAt,
                type: 'ORDER',
                description: `Invoice ${o.invoiceNo}`,
                amount: Number(o.totalAmount) * -1, // Spending is negative
                paymentMethod: o.paymentMethod,
                status: o.paymentStatus
            })),
            ...walletTx.map(t => ({
                id: `TX-${t.id}`,
                date: t.createdAt,
                type: t.type,
                description: t.description || t.type,
                amount: t.type === 'TOPUP' || t.type === 'REFUND' ? Number(t.amount) : Number(t.amount) * -1, // Adjust sign based on context if strictly tracking wallet. But here we want context.
                // Actually: TOPUP (+), REFUND (+). ADJUSTMENT (Depends, assume + or stored signed? DB val is likely abs).
                // Let's assume stored unsigned magnitude.
                paymentMethod: t.paymentMethod || 'SYSTEM',
                status: 'COMPLETED'
            }))
        ];

        // 4. Sort by Date Descending
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error("Member Transactions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
