import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const adjustmentSchema = z.object({
    productId: z.string(),
    adjustType: z.enum(['IN', 'OUT', 'CORRECTION', 'INITIAL']),
    quantity: z.number().positive(),
    reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};
        if (productId) where.productId = productId;

        const adjustments = await prisma.stockAdjustment.findMany({
            where,
            include: {
                product: { select: { name: true, category: true } },
                adjuster: { select: { fullName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ success: true, data: adjustments });
    } catch (error) {
        console.error('Stock adjustments GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch adjustments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = adjustmentSchema.parse(body);

        // Get user ID from header (set by middleware)
        const userId = parseInt(request.headers.get('x-user-id') || '1');

        // Get current product stock
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
            select: { stockQty: true, name: true },
        });

        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        const previousQty = product.stockQty;
        let newQty: number;

        if (data.adjustType === 'IN') {
            newQty = previousQty + data.quantity;
        } else if (data.adjustType === 'OUT') {
            newQty = Math.max(0, previousQty - data.quantity);
        } else {
            // CORRECTION or INITIAL - set to exact quantity
            newQty = data.quantity;
        }

        // Use transaction to update both
        const [adjustment] = await prisma.$transaction([
            prisma.stockAdjustment.create({
                data: {
                    productId: data.productId,
                    adjustType: data.adjustType,
                    quantity: data.quantity,
                    previousQty,
                    newQty,
                    reason: data.reason,
                    adjustedBy: userId,
                },
                include: {
                    product: { select: { name: true } },
                    adjuster: { select: { fullName: true } },
                },
            }),
            prisma.product.update({
                where: { id: data.productId },
                data: { stockQty: newQty },
            }),
        ]);

        return NextResponse.json({ success: true, data: adjustment }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        console.error('Stock adjustment POST error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create adjustment' }, { status: 500 });
    }
}
