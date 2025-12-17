import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        const whereClause = query
            ? {
                AND: [
                    { status: { not: 'BANNED' as const } },
                    {
                        OR: [
                            { fullName: { contains: query, mode: "insensitive" as const } },
                            { memberCode: { contains: query, mode: "insensitive" as const } },
                            { phone: { contains: query, mode: "insensitive" as const } },
                        ],
                    }
                ]
            }
            : { status: { not: 'BANNED' as const } };

        const members = await prisma.member.findMany({
            where: whereClause,
            take: 20,
            orderBy: { fullName: "asc" },
        });

        return NextResponse.json({ success: true, data: members });
    } catch (error) {
        console.error("Get members error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
