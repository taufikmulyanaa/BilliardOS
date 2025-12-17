import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMemberSchema = z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullName, phone, tier } = createMemberSchema.parse(body);

        // Get the last member to determine next sequential number
        const lastMember = await prisma.member.findFirst({
            orderBy: { id: 'desc' },
            select: { memberCode: true }
        });

        // Extract number from last code or start from 001
        let nextNumber = 1;
        if (lastMember?.memberCode) {
            const match = lastMember.memberCode.match(/-(\d+)$/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        // Generate member code: MEM-XXX (3 digits, zero-padded)
        const memberCode = `MEM-${String(nextNumber).padStart(3, '0')}`;

        const member = await prisma.member.create({
            data: {
                memberCode,
                fullName,
                phone,
                tier: tier || "BRONZE",
                status: "ACTIVE",
                joinDate: new Date(),
                pointsBalance: 0
            }
        });

        return NextResponse.json({ success: true, member });
    } catch (error) {
        console.error("Create Member error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
