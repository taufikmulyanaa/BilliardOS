import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    price: z.number(),
    qty: z.number(),
    type: z.enum(['PRODUCT', 'TABLE_BILL', 'OTHER']),
});

const transactionSchema = z.object({
    memberId: z.number().optional().nullable(),
    customerName: z.string().optional().nullable(),
    sessionId: z.number().optional().nullable(),
    paymentMethod: z.enum(['CASH', 'QRIS', 'DEBIT', 'CREDIT']),
    items: z.array(itemSchema),
    pointsRedeemed: z.number().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { memberId, customerName, sessionId, paymentMethod, items, pointsRedeemed = 0 } = transactionSchema.parse(body);

        // Calculate Totals
        let subtotal = 0;
        items.forEach(item => {
            subtotal += item.price * item.qty;
        });

        // Calculate Discount (1 Point = Rp 1.000)
        let discountAmount = 0;
        if (pointsRedeemed > 0 && memberId) {
            const member = await prisma.member.findUnique({ where: { id: memberId } });
            if (!member || member.pointsBalance < pointsRedeemed) {
                return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
            }
            discountAmount = pointsRedeemed * 1000;
        }

        const taxRate = 0.11;
        const taxableAmount = Math.max(0, subtotal - discountAmount);
        const taxAmount = Math.round(taxableAmount * taxRate);
        const totalAmount = taxableAmount + taxAmount;

        // Generate Invoice No
        const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Use raw SQL - need explicit CAST for PostgreSQL enums
        const orderResult = await prisma.$queryRawUnsafe<{ id: number }[]>(`
            INSERT INTO orders (
                invoice_no, session_id, member_id, customer_name, subtotal, 
                discount_amount, points_redeemed, tax_amount, 
                total_amount, payment_method, payment_status, created_at
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8,
                $9, $10::"PaymentMethod", 'PAID'::"PaymentStatus", NOW()
            )
            RETURNING id
        `, invoiceNo, sessionId || null, memberId || null, customerName || null, subtotal,
            discountAmount, pointsRedeemed, taxAmount, totalAmount, paymentMethod
        );

        const orderId = orderResult[0]?.id;
        if (!orderId) throw new Error("Failed to create order");

        // Insert order items
        for (const item of items) {
            await prisma.$executeRaw`
                INSERT INTO order_items (
                    order_id, product_id, item_name, quantity, unit_price, total_price
                ) VALUES (
                    ${orderId}, ${item.type === 'PRODUCT' ? item.id : null},
                    ${item.name}, ${item.qty}, ${item.price}, ${item.price * item.qty}
                )
            `;

            // Reduce stock for products
            if (item.type === 'PRODUCT' && item.id) {
                await prisma.$executeRaw`
                    UPDATE products SET stock_qty = stock_qty - ${item.qty} WHERE id = ${item.id}
                `;
            }
        }

        // Handle Points (if member)
        if (memberId) {
            if (pointsRedeemed > 0) {
                await prisma.$executeRaw`
                    UPDATE members SET points_balance = points_balance - ${pointsRedeemed} WHERE id = ${memberId}
                `;
                await prisma.$executeRaw`
                    INSERT INTO point_transactions (member_id, type, amount, description, created_at)
                    VALUES (${memberId}, 'REDEEM', ${-pointsRedeemed}, ${`Redeemed for ${invoiceNo}`}, NOW())
                `;
            }

            const pointsEarned = Math.floor(totalAmount / 10000);
            if (pointsEarned > 0) {
                await prisma.$executeRaw`
                    UPDATE members SET points_balance = points_balance + ${pointsEarned} WHERE id = ${memberId}
                `;
                await prisma.$executeRaw`
                    INSERT INTO point_transactions (member_id, type, amount, description, created_at)
                    VALUES (${memberId}, 'EARN', ${pointsEarned}, ${`Transaction ${invoiceNo}`}, NOW())
                `;
            }
        }

        return NextResponse.json({ success: true, order: { id: orderId, invoiceNo } });
    } catch (error) {
        console.error("Transaction Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: "Validation Error",
                details: error.issues
            }, { status: 400 });
        }
        // Return actual error message for debugging
        const message = error instanceof Error ? error.message : "Internal Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const paymentMethod = searchParams.get('paymentMethod');
        const search = searchParams.get('search');

        const where: any = {};

        // Date Filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // End of day
                where.createdAt.lte = end;
            }
        }

        // Payment Method Filter
        if (paymentMethod && paymentMethod !== 'ALL') {
            // Use type casting or ensure your input is valid PaymentMethod
            where.paymentMethod = paymentMethod as any;
        }

        // Search Filter (Invoice or Customer Name or Member Name)
        if (search) {
            where.OR = [
                { invoiceNo: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { member: { fullName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [total, orders] = await prisma.$transaction([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                take: limit,
                skip: skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: true,
                    member: {
                        select: { fullName: true }
                    }
                }
            })
        ]);

        // Map response to include resolved customer name
        const mappedOrders = orders.map(order => ({
            ...order,
            // Priority: Member Name > Saved Customer Name > Guest
            resolvedCustomerName: order.member?.fullName || (order as any).customerName || 'Guest'
        }));

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: mappedOrders,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("Get Transactions Error:", error);
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}
