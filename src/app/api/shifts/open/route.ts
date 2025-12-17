import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const openShiftSchema = z.object({
    openingCash: z.number().min(0),
});

export async function POST(request: Request) {
    try {
        const session = await getSession(request);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { openingCash } = openShiftSchema.parse(body);

        const userId = Number(session.id);

        // Check if already has open shift
        const existingShift = await prisma.shiftReport.findFirst({
            where: {
                staffId: userId,
                closedAt: { equals: undefined } // How to check null in Prisma? usually equals null, but Type Date?
                // Actually, closedAt is DateTime NOT null in schema? 
                // Schema: closedAt DateTime @default(now())
                // Wait, if it has a default, how do we distinguish open/closed?
                // Usually closedAt should be Nullable.
            },
        });

        // Let's check schema.
        // model ShiftReport { closedAt DateTime @default(now()) ... }
        // If it defaults to now(), it's always "closed" at creation?
        // That's a schema bug/limitation in my design.
        // I should have made closedAt Nullable `DateTime?`.

        // ACTION: I need to FIX the schema for closedAt to be optional/nullable.
        // But I already migrated. 
        // I can modify schema and re-migrate.
        // "closedAt DateTime @default(now())" means it is SET upon creation.
        // So "ShiftReport" essentially logs a CLOSED shift? No, we said "openedAt".
        // If I want to track OPEN state, closedAt should be null.

        // Let's fix schema first!

        return NextResponse.json({ error: "Schema Fix Required" }, { status: 500 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
