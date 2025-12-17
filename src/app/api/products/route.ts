import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['FOOD', 'DRINK', 'SNACK']),
    price: z.number(),
    stockQty: z.number(),
    imageUrl: z.string().optional(),
});

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { category: "asc" },
        });
        return NextResponse.json({ success: true, data: products });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = productSchema.parse(body);

        const product = await prisma.product.create({
            data: {
                ...data,
                price: data.price,
                isActive: true
            }
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error("Create Product Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

