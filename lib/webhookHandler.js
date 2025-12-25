import prisma from './prisma';
import crypto from 'crypto';
import { updateOrderStatus } from './orderStateMachine';
import { sendPaymentNotification } from './whatsapp';

/**
 * WEBHOOK IDEMPOTENCY HANDLER
 * 
 * Prevents double-processing of webhooks
 * Critical for payment systems where webhooks may be retried
 */

/**
 * Verify Midtrans signature
 */
export function verifyMidtransSignature(orderId, statusCode, grossAmount, serverKey) {
    const signatureString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    return crypto.createHash('sha512').update(signatureString).digest('hex');
}

/**
 * Process payment webhook with idempotency
 */
export async function processPaymentWebhook(webhookData) {
    const {
        order_id: orderId,
        transaction_id: transactionId,
        transaction_status,
        fraud_status,
        payment_type,
        gross_amount,
        signature_key,
        status_code
    } = webhookData;

    // Verify signature
    const expectedSignature = verifyMidtransSignature(
        orderId,
        status_code,
        gross_amount,
        process.env.MIDTRANS_SERVER_KEY
    );

    if (signature_key !== expectedSignature) {
        throw new Error('Invalid signature - potential fraud');
    }

    // Check if already processed (IDEMPOTENCY)
    const existingLog = await prisma.paymentLog.findFirst({
        where: {
            transactionId,
            orderId
        }
    });

    if (existingLog) {
        console.log(`Webhook already processed for transaction ${transactionId}`);
        return {
            success: true,
            message: 'Already processed',
            duplicate: true,
            existingLog
        };
    }

    // Process webhook in transaction
    return await prisma.$transaction(async (tx) => {
        // Log payment webhook
        const paymentLog = await tx.paymentLog.create({
            data: {
                orderId,
                transactionId,
                paymentType: payment_type,
                grossAmount: parseFloat(gross_amount),
                status: transaction_status,
                fraudStatus: fraud_status,
                signatureKey: signature_key,
                rawResponse: webhookData
            }
        });

        // Find order
        const order = await tx.order.findFirst({
            where: {
                orderNumber: orderId
            }
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }


        // Determine payment status and order status
        // Mapping per ORDER_PAYMENT_RULES.md section 5:
        // - INIT / PENDING → Order = PENDING_PAYMENT
        // - SUCCESS → Order = PAID
        // - FAILED → Order = FAILED
        // - EXPIRED → Order = CANCELLED
        let newPaymentStatus = null;
        let newOrderStatus = null;

        switch (transaction_status) {
            case 'capture':
                if (fraud_status === 'accept') {
                    newPaymentStatus = 'SUCCESS';
                    newOrderStatus = 'PAID';
                } else {
                    // fraud_status = challenge/deny
                    newPaymentStatus = 'FAILED';
                    newOrderStatus = 'FAILED';
                }
                break;

            case 'settlement':
                newPaymentStatus = 'SUCCESS';
                newOrderStatus = 'PAID';
                break;

            case 'pending':
                newPaymentStatus = 'PENDING';
                // Keep order as PENDING_PAYMENT
                break;

            case 'deny':
            case 'cancel':
                newPaymentStatus = 'FAILED';
                newOrderStatus = 'FAILED'; // Per rules section 5
                break;

            case 'expire':
                newPaymentStatus = 'EXPIRED';
                newOrderStatus = 'CANCELLED'; // Per rules section 5
                break;
        }

        // ============================================================
        // CRITICAL: UPDATE PAYMENT STATUS FIRST
        // This ensures the payment guard in orderStateMachine will pass
        // ============================================================
        if (newPaymentStatus) {
            await tx.payment.updateMany({
                where: { orderId: order.id },
                data: {
                    status: newPaymentStatus,
                    ...(newPaymentStatus === 'SUCCESS' && { paidAt: new Date() })
                }
            });
        }

        // Update order status (if needed) using state machine
        // The state machine will verify payment status before allowing PAID
        if (newOrderStatus && order.status !== newOrderStatus) {
            await updateOrderStatus(
                order.id,
                newOrderStatus,
                'SYSTEM',
                `Payment ${transaction_status} via ${payment_type}`,
                {
                    transactionId,
                    paymentType: payment_type,
                    fraudStatus: fraud_status
                }
            );
        }

        // Send WhatsApp notification for successful payment (fire and forget)
        if (newPaymentStatus === 'SUCCESS') {
            // Fetch full order with user for notification
            const fullOrder = await tx.order.findUnique({
                where: { id: order.id },
                include: { user: true, address: true, items: true }
            });
            // Don't await - send async to not block webhook response
            sendPaymentNotification(fullOrder).catch(err => {
                console.error('[WhatsApp] Payment notification failed:', err);
            });
        }

        return {
            success: true,
            message: 'Webhook processed',
            duplicate: false,
            paymentLog,
            paymentStatus: newPaymentStatus,
            orderStatus: newOrderStatus
        };
    });
}

/**
 * Get payment logs for an order
 */
export async function getPaymentLogs(orderId) {
    return await prisma.paymentLog.findMany({
        where: { orderId },
        orderBy: { processedAt: 'desc' }
    });
}

/**
 * Check if payment is duplicate
 */
export async function isDuplicatePayment(transactionId) {
    const existing = await prisma.paymentLog.findUnique({
        where: { transactionId }
    });
    return !!existing;
}
