import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const promoSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'HAPPY_HOUR']),
    value: z.number().positive(),
    minPurchase: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    daysOfWeek: z.string().optional(),
    tableTypes: z.string().optional(),
    isActive: z.boolean().optional(),
});

export async function GET() {
    try {
        const promos = await prisma.promo.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: promos });
    } catch (error) {
        console.error('Promos GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch promos' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = promoSchema.parse(body);

        const promo = await prisma.promo.create({
            data: {
                name: data.name,
                description: data.description,
                type: data.type,
                value: data.value,
                minPurchase: data.minPurchase,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                startTime: data.startTime,
                endTime: data.endTime,
                daysOfWeek: data.daysOfWeek,
                tableTypes: data.tableTypes,
                isActive: data.isActive ?? true,
            },
        });

        return NextResponse.json({ success: true, data: promo }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        console.error('Promo POST error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create promo' }, { status: 500 });
    }
}
