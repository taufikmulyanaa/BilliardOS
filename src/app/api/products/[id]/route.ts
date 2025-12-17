import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    name: z.string().optional(),
    category: z.enum(['FOOD', 'DRINK', 'SNACK']).optional(),
    price: z.number().optional(),
    stockQty: z.number().optional(),
    imageUrl: z.string().optional(),
    isActive: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
    request: Request,
    context: RouteContext
) {
    try {
        const params = await context.params;
        const id = params.id;
        const body = await request.json();
        const data = updateSchema.parse(body);

        const product = await prisma.product.update({
            where: { id },
            data
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error("Update Product Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: RouteContext
) {
    try {
        const params = await context.params;
        const id = params.id;

        // Soft delete
        const product = await prisma.product.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error("Delete Product Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
