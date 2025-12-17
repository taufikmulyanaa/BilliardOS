import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
    fullName: z.string().optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
    pinCode: z.string().optional(),
    password: z.string().min(6).optional(),
});

// GET single user
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = parseInt((await params).id);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// UPDATE user
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = parseInt((await params).id);
        const body = await request.json();
        const data = updateUserSchema.parse(body);

        const updateData: any = {};
        if (data.fullName) updateData.fullName = data.fullName;
        if (data.role) updateData.role = data.role;
        if (data.pinCode !== undefined) updateData.pinCode = data.pinCode;

        if (data.password) {
            const bcrypt = await import('bcryptjs');
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Update user error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = parseInt((await params).id);

        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ success: true, message: "User deleted" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
