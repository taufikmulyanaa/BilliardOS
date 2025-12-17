import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
    try {
        const count = await prisma.user.count();

        if (count > 0) {
            return NextResponse.json(
                { message: "Setup already completed. Users exist." },
                { status: 400 }
            );
        }

        // Create Initial Admin
        const hashedPassword = await hashPassword("admin123");

        const admin = await prisma.user.create({
            data: {
                username: "admin",
                passwordHash: hashedPassword,
                fullName: "System Admin",
                role: "ADMIN",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Admin user created. Username: admin, Password: admin123",
            user: { id: admin.id, username: admin.username, role: admin.role },
        });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
