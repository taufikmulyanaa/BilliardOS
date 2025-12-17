import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMemberSchema = z.object({
    fullName: z.string().optional(),
    phone: z.string().optional(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional(),
    status: z.enum(['ACTIVE', 'EXPIRED', 'BANNED']).optional(),
});

// GET single member with transaction history
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const memberId = parseInt((await params).id);

        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                sessions: {
                    orderBy: { startTime: 'desc' },
                    take: 10,
                    include: {
                        table: { select: { name: true } },
                        orders: { select: { totalAmount: true, createdAt: true } }
                    }
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        invoiceNo: true,
                        totalAmount: true,
                        pointsRedeemed: true,
                        createdAt: true,
                    }
                }
            }
        });

        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Calculate stats
        const totalSpent = member.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const totalVisits = member.sessions.length;
        const totalPointsEarned = member.transactions
            .filter(t => t.type === 'EARN')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalPointsRedeemed = member.transactions
            .filter(t => t.type === 'REDEEM')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return NextResponse.json({
            success: true,
            data: {
                ...member,
                stats: {
                    totalSpent,
                    totalVisits,
                    totalPointsEarned,
                    totalPointsRedeemed,
                }
            }
        });
    } catch (error) {
        console.error("Get member error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// UPDATE member
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const memberId = parseInt((await params).id);
        const body = await request.json();
        const data = updateMemberSchema.parse(body);

        const member = await prisma.member.update({
            where: { id: memberId },
            data: {
                ...(data.fullName && { fullName: data.fullName }),
                ...(data.phone && { phone: data.phone }),
                ...(data.tier && { tier: data.tier }),
                ...(data.status && { status: data.status }),
            },
        });

        return NextResponse.json({ success: true, data: member });
    } catch (error) {
        console.error("Update member error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE member (soft delete - set status to BANNED)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const memberId = parseInt((await params).id);

        const member = await prisma.member.update({
            where: { id: memberId },
            data: { status: 'BANNED' },
        });

        return NextResponse.json({ success: true, message: "Member deleted", data: member });
    } catch (error) {
        console.error("Delete member error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
