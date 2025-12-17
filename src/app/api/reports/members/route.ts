import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get all members with their transaction data
        const members = await prisma.member.findMany({
            where: { status: 'ACTIVE' },
            include: {
                orders: {
                    select: { totalAmount: true, createdAt: true }
                },
                sessions: {
                    select: { startTime: true }
                },
                transactions: {
                    select: { type: true, amount: true }
                }
            }
        });

        // Calculate stats for each member
        const memberStats = members.map(member => {
            const totalSpent = member.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const totalVisits = member.sessions.length;
            const pointsEarned = member.transactions
                .filter(t => t.type === 'EARN')
                .reduce((sum, t) => sum + t.amount, 0);
            const pointsRedeemed = member.transactions
                .filter(t => t.type === 'REDEEM')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const lastVisit = member.sessions.length > 0
                ? new Date(Math.max(...member.sessions.map(s => new Date(s.startTime).getTime())))
                : null;

            return {
                id: member.id,
                memberCode: member.memberCode,
                fullName: member.fullName,
                tier: member.tier,
                pointsBalance: member.pointsBalance,
                totalSpent,
                totalVisits,
                pointsEarned,
                pointsRedeemed,
                lastVisit,
                avgSpendPerVisit: totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0,
            };
        });

        // Top spenders
        const topSpenders = [...memberStats]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        // Most frequent visitors
        const frequentVisitors = [...memberStats]
            .sort((a, b) => b.totalVisits - a.totalVisits)
            .slice(0, 10);

        // Tier distribution
        const tierDistribution: Record<string, number> = { BRONZE: 0, SILVER: 0, GOLD: 0 };
        members.forEach(m => {
            tierDistribution[m.tier] = (tierDistribution[m.tier] || 0) + 1;
        });

        // Members with high points (potential for redemption)
        const highPointsMembers = memberStats
            .filter(m => m.pointsBalance >= 50)
            .sort((a, b) => b.pointsBalance - a.pointsBalance)
            .slice(0, 10);

        // Summary
        const totalMembers = members.length;
        const totalPointsInCirculation = members.reduce((sum, m) => sum + m.pointsBalance, 0);
        const avgPointsPerMember = totalMembers > 0 ? Math.round(totalPointsInCirculation / totalMembers) : 0;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalMembers,
                    totalPointsInCirculation,
                    avgPointsPerMember,
                    tierDistribution,
                },
                topSpenders,
                frequentVisitors,
                highPointsMembers,
            }
        });
    } catch (error) {
        console.error("Member analytics error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
