import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { requireAuth } from '@/lib/auth';


export const GET = requireAuth(async function GET(request, context) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID required' },
                { status: 400 }
            );
        }

        // Get payment with order
        const payment = await prisma.payments.findUnique({
            where: { orderId },
            include: {
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        user_id: true,
                        status: true,
                        total: true,
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (payment.order.user_id !== context.users.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            payments: {
                id: payment.id,
                orderNumber: payment.order.orderNumber,
                amount: payment.amount,
                status: payment.status,
                payment_method: payment.paymentMethod,
                paid_at: payment.paidAt,
                expiresAt: payment.expiresAt,
                created_at: payment.created_at,
            },
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        return NextResponse.json(
            { error: 'Failed to get payment status' },
            { status: 500 }
        );
    }
});

