import { NextResponse } from 'next/server';
import { processPaymentWebhook } from '@/lib/webhookHandler';
import { sendPaymentSuccessEmail } from '@/lib/email';
import { logger } from '@/lib/errors';

/**
 * INDUSTRY-GRADE PAYMENT WEBHOOK
 * 
 * Features:
 * - Idempotency (prevents double processing)
 * - Signature verification
 * - Transaction safety
 * - Comprehensive logging
 */

export async function POST(request) {
    try {
        const notification = await request.json();

        logger.info('Payment webhook received', {
            orderId: notification.order_id,
            transactionId: notification.transaction_id,
            status: notification.transaction_status,
            paymentType: notification.payment_type
        });

        // Process webhook with idempotency
        const result = await processPaymentWebhook(notification);

        // If duplicate, return early
        if (result.duplicate) {
            logger.info('Duplicate webhook ignored', {
                transactionId: notification.transaction_id
            });

            return NextResponse.json({
                success: true,
                message: 'Already processed',
                duplicate: true
            });
        }

        // Send email if payment successful
        if (result.orderStatus === 'PAID') {
            logger.info('Payment successful - sending notification email');

            const { default: prisma } = await import('@/lib/prisma');

            const order = await prisma.order.findFirst({
                where: { orderNumber: notification.order_id },
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // Send email asynchronously (don't block webhook response)
            if (order) {
                sendPaymentSuccessEmail(order).catch((error) => {
                    logger.error('Failed to send payment email', { error: error.message });
                });
            }
        }

        logger.info('Webhook processed successfully', {
            orderId: notification.order_id,
            newStatus: result.orderStatus,
            duplicate: false
        });

        return NextResponse.json({
            success: true,
            status: result.orderStatus,
            message: 'Webhook processed'
        });

    } catch (error) {
        logger.error('Webhook processing error', {
            error: error.message,
            stack: error.stack
        });

        // Return 200 to prevent Midtrans retrying on our internal errors
        // Log the error instead for manual investigation
        return NextResponse.json({
            success: false,
            error: 'Internal processing error',
            message: error.message
        }, { status: 200 }); // Return 200 to stop retries
    }
}
