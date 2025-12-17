import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Default business config
const defaultConfig: Record<string, string> = {
    businessName: 'BilliardOS',
    address: 'Jl. Billiard No. 123, Jakarta',
    phone: '021-1234567',
    email: 'info@billiardos.com',
    taxRate: '10',
    openTime: '10:00',
    closeTime: '23:00',
    receiptHeader: 'Terima kasih telah berkunjung!',
    receiptFooter: 'Sampai jumpa kembali!',
};

export async function GET() {
    try {
        const configs = await prisma.businessConfig.findMany();

        // Merge with defaults
        const configMap: Record<string, string> = { ...defaultConfig };
        configs.forEach((c: { key: string; value: string }) => {
            configMap[c.key] = c.value;
        });

        return NextResponse.json({ success: true, data: configMap });
    } catch (error) {
        console.error('Config GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
    }
}

const updateConfigSchema = z.record(z.string(), z.string());

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const updates = updateConfigSchema.parse(body);

        // Upsert each config key
        const operations = Object.entries(updates).map(([key, value]) =>
            prisma.businessConfig.upsert({
                where: { key },
                create: { key, value },
                update: { value },
            })
        );

        await prisma.$transaction(operations);

        // Return updated config
        const configs = await prisma.businessConfig.findMany();
        const configMap: Record<string, string> = { ...defaultConfig };
        configs.forEach((c: { key: string; value: string }) => {
            configMap[c.key] = c.value;
        });

        return NextResponse.json({ success: true, data: configMap });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        console.error('Config PATCH error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
    }
}
