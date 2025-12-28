/**
 * ORDER STATE MACHINE V2 - Final Integration
 * Integrated with Email Service, Audit, Escrow, and Stock
 */

import prisma from './prisma';
import { confirmReservation, releaseReservation } from './stockReservation';
import { releaseEscrow, holdEscrow } from './escrowManager';
import { logAudit } from './auditLogger';
import { emailService } from './emailService';
import { returnManager } from './returnManager';

// Valid state transitions
const TRANSITIONS = {
    // Payment flow
    selectPayment: {
        from: ['PENDING_PAYMENT'],
        to: 'WAITING_PAYMENT',
        validator: async (order) => true,
        onTransition: async (order) => {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            await prisma.orders.update({
                where: { id: order.id },
                data: {
                    payment_expires_at: expiresAt
                }
            });

            // Send Payment Reminder Email
            if (order.guest_email || order.users?.email) {
                await emailService.sendPaymentReminder(order).catch(console.error);
            }
        }
    },

    confirmPayment: {
        from: ['WAITING_PAYMENT', 'PENDING_PAYMENT'],
        to: 'PAID',
        validator: async (order, context) => {
            if (!context.paymentProof) {
                return "Payment proof required";
            }
            return true;
        },
        onTransition: async (order) => {
            const now = new Date();
            const autoCompleteAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            await prisma.orders.update({
                where: { id: order.id },
                data: {
                    paid_at: now,
                    escrow_held_at: now,
                    auto_complete_at: autoCompleteAt
                }
            });

            // Confirm stock reservation
            await confirmReservation(order.id);

            // Log audit
            await logAudit({
                user_id: order.user_id,
                action: 'payment_confirmed',
                resource: `orders:${order.id}`,
                metadata: { amount: Number(order.total) }
            });

            // Send Order Confirmation Email
            if (order.guest_email || order.users?.email) {
                await emailService.sendOrderConfirmation(order).catch(console.error);
            }
        }
    },

    startProcessing: {
        from: ['PAID'],
        to: 'PROCESSING',
        onTransition: async (order) => {
            await prisma.orders.update({
                where: { id: order.id },
                data: { processed_at: new Date() }
            });
            // Optional: Send processing email
        }
    },

    ship: {
        from: ['PROCESSING'],
        to: 'SHIPPED',
        validator: async (order, context) => {
            if (!context.trackingNumber) {
                return "Tracking number required";
            }
            return true;
        },
        onTransition: async (order, context) => {
            await prisma.orders.update({
                where: { id: order.id },
                data: { shipped_at: new Date() }
            });

            // Update shipment
            await prisma.shipments.updateMany({
                where: { order_id: order.id },
                data: {
                    tracking_number: context.trackingNumber,
                    status: 'IN_TRANSIT'
                }
            });

            // Send Shipping Email (TODO)
        }
    },

    markDelivered: {
        from: ['SHIPPED'],
        to: 'DELIVERED',
        onTransition: async (order) => {
            const now = new Date();
            const completionDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

            const returnDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            await prisma.orders.update({
                where: { id: order.id },
                data: {
                    delivered_at: now,
                    auto_complete_at: completionDate,
                    return_deadline: returnDeadline
                }
            });
        }
    },

    complete: {
        from: ['DELIVERED'],
        to: 'COMPLETED',
        validator: async (order) => {
            const daysSinceDelivery = Math.floor(
                (Date.now() - new Date(order.delivered_at).getTime()) / (24 * 60 * 60 * 1000)
            );

            if (daysSinceDelivery < 1) {
                return "Must wait at least 1 day after delivery";
            }

            return true;
        },
        onTransition: async (order) => {
            const now = new Date();

            await prisma.orders.update({
                where: { id: order.id },
                data: {
                    completed_at: now,
                    escrow_released_at: now
                }
            });

            // Release escrow to seller
            await releaseEscrow(order.id);

            await logAudit({
                user_id: order.user_id,
                action: 'order_completed',
                resource: `orders:${order.id}`,
                metadata: { amount: Number(order.total) }
            });
        }
    },

    cancelByBuyer: {
        from: ['PENDING_PAYMENT', 'WAITING_PAYMENT', 'PAID'],
        to: 'CANCELLED',
        onTransition: async (order, context) => {
            await prisma.orders.update({
                where: { id: order.id },
                data: {
                    cancelled_at: new Date(),
                    cancelled_by: 'buyer',
                    cancellation_reason: context.reason
                }
            });

            // Release stock reservation
            await releaseReservation(order.id, 'buyer_cancelled');

            // Initiate refund if paid
            if (order.status === 'PAID') {
                // TODO: Trigger refund logic
            }
        }
    },

    cancelBySeller: {
        from: ['PAID', 'PROCESSING'],
        to: 'CANCELLED',
        onTransition: async (order, context) => {
            await prisma.orders.update({
                where: { id: order.id },
                data: {
                    cancelled_at: new Date(),
                    cancelled_by: 'seller',
                    cancellation_reason: context.reason
                }
            });

            await releaseReservation(order.id, 'seller_cancelled');
        }
    },

    expirePayment: {
        from: ['WAITING_PAYMENT'],
        to: 'CANCELLED',
        onTransition: async (order) => {
            await prisma.orders.update({
                where: { id: order.id },
                data: {
                    cancelled_at: new Date(),
                    cancelled_by: 'auto',
                    cancellation_reason: 'Payment expired'
                }
            });

            await releaseReservation(order.id, 'payment_expired');
        }
    }
};

/**
 * Main state transition function
 */
export async function transitionOrderState(orderId, transitionName, context = {}) {
    const transition = TRANSITIONS[transitionName];
    if (!transition) {
        return { success: false, error: 'Invalid transition' };
    }

    // Get current order
    const order = await prisma.orders.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        return { success: false, error: 'Order not found' };
    }

    // Validate current state
    if (!transition.from.includes(order.status)) {
        return {
            success: false,
            error: `Cannot transition from ${order.status} to ${transition.to}`
        };
    }

    // Run custom validator
    if (transition.validator) {
        const validationResult = await transition.validator(order, context);
        if (validationResult !== true) {
            return { success: false, error: validationResult };
        }
    }

    // Execute transition in transaction
    try {
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Update order status
            const updated = await tx.orders.update({
                where: { id: orderId },
                data: { status: transition.to }
            });

            // Log status history
            await tx.order_state_logs.create({
                data: {
                    order_id: orderId,
                    from_status: order.status,
                    to_status: transition.to,
                    reason: context.reason,
                    changed_by: context.userId || 'system',
                    metadata: context.metadata || {}
                }
            });

            return updated;
        });

        // Execute post-transition hooks
        if (transition.onTransition) {
            await transition.onTransition(order, context);
        }

        return { success: true, orders: updatedOrder };

    } catch (error) {
        console.error('State transition error:', error);
        return { success: false, error: 'Failed to transition state' };
    }
}

/**
 * Auto-complete old delivered orders
 */
export async function autoCompleteOrders() {
    const orders = await prisma.orders.findMany({
        where: {
            status: 'DELIVERED',
            auto_complete_at: { lte: new Date() }
        }
    });

    for (const order of orders) {
        await transitionOrderState(order.id, 'complete', { user_id: 'system' });
    }

    return orders;
}

/**
 * Expire old pending payments
 */
export async function expirePayments() {
    const orders = await prisma.orders.findMany({
        where: {
            status: 'WAITING_PAYMENT',
            payment_expires_at: { lte: new Date() }
        }
    });

    for (const order of orders) {
        await transitionOrderState(order.id, 'expirePayment', { user_id: 'system' });
    }

    return orders;
}
