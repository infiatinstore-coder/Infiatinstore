/**
 * ENHANCED WEBHOOK HANDLER V3
 * Integrates all production systems
 */

import prisma from './prisma';
import crypto from 'crypto';
import { transitionOrderState } from './orderStateMachine-v2';
import { sendPaymentNotification } from './whatsapp';
import { logAudit } from './auditLogger';
import { logWebhook } from './webhookLogger';

export function verifyMidtransSignature(webhookData) {
    const { order_id, status_code, gross_amount, signature_key } = webhookData;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const signatureString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex');
    return signature_key === expectedSignature;
}

export async function processPaymentWebhook(webhookData) {
    const {
        order_id: orderNumber,
        transaction_id: transactionId,
        transaction_status,
        fraud_status,
        payment_type,
        gross_amount,
        transaction_time
    } = webhookData;

    // Verify signature
    const isValid = verifyMidtransSignature(webhookData);
    if (!isValid) {
        await logWebhook('midtrans', transaction_status, webhookData, 'failed', new Error('Invalid signature'));
        throw new Error('Invalid webhook signature');
    }

    // Process in transaction
    return await prisma.$transaction(async (tx) => {
        // Find order
        const order = await tx.orders.findUnique({
            where: { order_number: orderNumber },
            include: { user: true }
        });

        if (!order) {
            throw new Error(`Order ${orderNumber} not found`);
        }

        // Idempotent payment record
        const payment = await tx.payments.upsert({
            where: { gateway_transaction_id: transactionId },
            create: {
                order_id: order.id,
                gateway_transaction_id: transactionId,
                gateway_order_id: orderNumber,
                payment_method: payment_type,
                amount: parseFloat(gross_amount),
                status: mapTransactionStatus(transaction_status, fraud_status),
                fraud_status: fraud_status,
                paid_at: ['settlement', 'capture'].includes(transaction_status) ? new Date(transaction_time) : null,
                gateway_response: webhookData
            },
            update: {
                status: mapTransactionStatus(transaction_status, fraud_status),
                fraud_status: fraud_status,
                paid_at: ['settlement', 'capture'].includes(transaction_status) ? new Date(transaction_time) : null,
                gateway_response: webhookData,
                updated_at: new Date()
            }
        });

        // Log webhook
        await logWebhook('midtrans', transaction_status, webhookData, 'success');

        // Log payment to PaymentLog
        await tx.payment_logs.create({
            data: {
                order_id: orderNumber,
                transaction_id: transactionId,
                payment_type: payment_type,
                gross_amount: parseFloat(gross_amount),
                status: transaction_status,
                fraud_status: fraud_status,
                signature_key: webhookData.signature_key,
                raw_response: webhookData
            }
        });

        // Handle state transitions
        let orderTransition = null;

        switch (transaction_status) {
            case 'capture':
            case 'settlement':
                if (fraud_status === 'accept') {
                    orderTransition = await transitionOrderState(
                        order.id,
                        'confirmPayment',
                        {
                            user_id: 'system',
                            paymentProof: transactionId
                        }
                    );
                }
                break;

            case 'pending':
                await tx.orders.update({
                    where: { id: order.id },
                    data: {
                        status: 'WAITING_PAYMENT',
                        payment_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
                    }
                });
                break;

            case 'deny':
            case 'cancel':
            case 'expire':
                orderTransition = await transitionOrderState(
                    order.id,
                    'expirePayment',
                    { user_id: 'system', reason: transaction_status }
                );
                break;
        }

        // Log audit
        if (payment.status === 'SUCCESS') {
            await logAudit({
                user_id: order.user_id,
                action: 'payment_received',
                resource: `order:${order.id}`,
                metadata: {
                    transactionId,
                    amount: Number(gross_amount),
                    method: payment_type
                }
            });
        }

        // Send notification
        if (payment.status === 'SUCCESS' && order.user) {
            sendPaymentNotification({
                ...order,
                phone: order.guest_phone || order.user.phone
            }).catch(err => {
                console.error('[WhatsApp] Payment notification failed:', err);
            });
        }

        return {
            success: true,
            duplicate: false,
            paymentStatus: payment.status,
            orderStatus: orderTransition?.order?.status || order.status,
            payment,
            order
        };
    });
}

function mapTransactionStatus(transaction_status, fraud_status) {
    switch (transaction_status) {
        case 'capture':
            return fraud_status === 'accept' ? 'SUCCESS' : 'FAILED';
        case 'settlement':
            return 'SUCCESS';
        case 'pending':
            return 'PENDING';
        case 'deny':
        case 'cancel':
            return 'FAILED';
        case 'expire':
            return 'EXPIRED';
        case 'refund':
        case 'partial_refund':
            return 'REFUNDED';
        default:
            return 'PENDING';
    }
}

export async function retryFailedWebhooks() {
    const failedPayments = await prisma.payments.findMany({
        where: {
            status: 'PENDING',
            created_at: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        },
        include: { orders: true }
    });

    console.log(`🔄 Retrying ${failedPayments.length} failed webhooks...`);

    for (const payment of failedPayments) {
        try {
            const response = await fetch(
                `https://api.midtrans.com/v2/${payment.gateway_order_id}/status`,
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) continue;

            const data = await response.json();
            await processPaymentWebhook(data);

            console.log(`✅ Successfully retried payment ${payment.id}`);

        } catch (error) {
            console.error(`❌ Failed to retry payment ${payment.id}:`, error.message);
        }
    }
}
