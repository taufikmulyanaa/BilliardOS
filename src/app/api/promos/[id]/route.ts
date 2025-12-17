import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePromoSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'HAPPY_HOUR']).optional(),
    value: z.number().positive().optional(),
    minPurchase: z.number().optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    daysOfWeek: z.string().optional().nullable(),
    tableTypes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const promoId = parseInt((await params).id);

        const promo = await prisma.promo.findUnique({
            where: { id: promoId },
        });

        if (!promo) {
            return NextResponse.json({ success: false, error: 'Promo not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: promo });
    } catch (error) {
        console.error('Promo GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch promo' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const promoId = parseInt((await params).id);
        const body = await request.json();
        const data = updatePromoSchema.parse(body);

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type) updateData.type = data.type;
        if (data.value) updateData.value = data.value;
        if (data.minPurchase !== undefined) updateData.minPurchase = data.minPurchase;
        if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
        if (data.startTime !== undefined) updateData.startTime = data.startTime;
        if (data.endTime !== undefined) updateData.endTime = data.endTime;
        if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek;
        if (data.tableTypes !== undefined) updateData.tableTypes = data.tableTypes;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const promo = await prisma.promo.update({
            where: { id: promoId },
            data: updateData,
        });

        return NextResponse.json({ success: true, data: promo });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        console.error('Promo PATCH error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update promo' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const promoId = parseInt((await params).id);

        await prisma.promo.delete({
            where: { id: promoId },
        });

        return NextResponse.json({ success: true, message: 'Promo deleted' });
    } catch (error) {
        console.error('Promo DELETE error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete promo' }, { status: 500 });
    }
}
