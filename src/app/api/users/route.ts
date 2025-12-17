import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).default('CASHIER'),
    pinCode: z.string().optional(),
});

// GET all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                pinCode: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        console.error("Get users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// CREATE user
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, fullName, role, pinCode } = userSchema.parse(body);

        // Check if username exists
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }

        // Hash password
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                fullName,
                role,
                pinCode,
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch (error) {
        console.error("Create user error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
