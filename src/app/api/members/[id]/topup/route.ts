import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const topUpSchema = z.object({
    amount: z.number().min(1000, "Minimum top up Rp 1.000"),
    paymentMethod: z.enum(['CASH', 'QRIS', 'DEBIT', 'CREDIT']),
    description: z.string().optional()
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const memberId = parseInt((await params).id);
        if (isNaN(memberId)) {
            return NextResponse.json({ error: "Invalid Member ID" }, { status: 400 });
        }

        const body = await request.json();
        const { amount, paymentMethod, description } = topUpSchema.parse(body);

        // Transaction: Update Balance + Add History
        const [updatedMember, transaction] = await prisma.$transaction([
            prisma.member.update({
                where: { id: memberId },
                data: {
                    walletBalance: { increment: amount }
                }
            }),
            prisma.walletTransaction.create({
                data: {
                    memberId,
                    type: 'TOPUP',
                    amount: amount,
                    paymentMethod: paymentMethod,
                    description: description || `Top Up via ${paymentMethod}`
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                balance: updatedMember.walletBalance,
                transactionId: transaction.id
            }
        });

    } catch (error) {
        console.error("Top Up Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
