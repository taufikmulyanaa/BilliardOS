import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fromTableId, toTableId } = body;

        if (!fromTableId || !toTableId) {
            return NextResponse.json({ error: "Missing table IDs" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Validate Source Table (Must be ACTIVE and have open session)
            const fromTable = await tx.table.findUnique({
                where: { id: fromTableId },
                include: { sessions: { where: { status: 'OPEN' } } }
            });

            if (!fromTable || fromTable.status !== 'ACTIVE' || fromTable.sessions.length === 0) {
                throw new Error("Source table is not active or has no open session");
            }

            const session = fromTable.sessions[0];

            // 2. Validate Target Table (Must be AVAILABLE)
            const toTable = await tx.table.findUnique({ where: { id: toTableId } });
            if (!toTable || toTable.status !== 'AVAILABLE') {
                throw new Error("Target table is not available");
            }

            // 3. Move Session
            await tx.tableSession.update({
                where: { id: session.id },
                data: { tableId: toTableId }
            });

            // 4. Update Table Statuses
            // Source becomes CLEANING (standard practice)
            await tx.table.update({
                where: { id: fromTableId },
                data: { status: 'CLEANING' }
            });

            // Target becomes ACTIVE
            await tx.table.update({
                where: { id: toTableId },
                data: { status: 'ACTIVE' }
            });

            return { success: true };
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Transfer error:", error);
        return NextResponse.json({ error: error.message || "Transfer failed" }, { status: 400 });
    }
}
