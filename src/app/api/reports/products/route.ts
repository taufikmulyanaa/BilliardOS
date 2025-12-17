import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get all order items
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: startDate },
                    paymentStatus: 'PAID',
                }
            },
            include: {
                product: { select: { id: true, name: true, category: true, stockQty: true } }
            }
        });

        // Aggregate by product
        const productStats: Record<string, {
            id: string;
            name: string;
            category: string;
            stockQty: number;
            qtySold: number;
            revenue: number;
        }> = {};

        orderItems.forEach(item => {
            if (!item.productId) return;

            if (!productStats[item.productId]) {
                productStats[item.productId] = {
                    id: item.productId,
                    name: item.product?.name || item.itemName,
                    category: item.product?.category || 'UNKNOWN',
                    stockQty: item.product?.stockQty || 0,
                    qtySold: 0,
                    revenue: 0,
                };
            }
            productStats[item.productId].qtySold += item.quantity;
            productStats[item.productId].revenue += Number(item.totalPrice);
        });

        const products = Object.values(productStats);

        // Best sellers (by revenue)
        const bestSellers = [...products]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Slow movers (sold less than 5 in period)
        const slowMovers = products
            .filter(p => p.qtySold < 5)
            .sort((a, b) => a.qtySold - b.qtySold);

        // Low stock (below 10)
        const lowStock = await prisma.product.findMany({
            where: { stockQty: { lt: 10 }, isActive: true },
            orderBy: { stockQty: 'asc' },
        });

        // Category breakdown
        const categoryStats: Record<string, { qty: number; revenue: number }> = {};
        products.forEach(p => {
            if (!categoryStats[p.category]) {
                categoryStats[p.category] = { qty: 0, revenue: 0 };
            }
            categoryStats[p.category].qty += p.qtySold;
            categoryStats[p.category].revenue += p.revenue;
        });

        return NextResponse.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                bestSellers,
                slowMovers: slowMovers.slice(0, 10),
                lowStock: lowStock.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    stockQty: p.stockQty,
                })),
                categoryBreakdown: Object.entries(categoryStats).map(([category, stats]) => ({
                    category,
                    ...stats,
                })),
            }
        });
    } catch (error) {
        console.error("Product report error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
