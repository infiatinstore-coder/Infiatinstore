/**
 * ORDER NOTIFICATIONS INTEGRATION
 * Hooks for order lifecycle events
 */

import { notificationService } from '../notificationService';

/**
 * Order Created
 */
export async function onOrderCreated(order) {
    await notificationService.createNotification({
        userId: order.user_id,
        type: 'ORDER_PLACED',
        title: '🛍️ Order Placed',
        message: `Your order #${order.order_number} has been placed successfully!`,
        actionUrl: `/orders/${order.id}`,
        priority: 'NORMAL',
        extraData: {
            orderId: order.id,
            orderNumber: order.order_number,
            total: order.total
        }
    });
}

/**
 * Payment Confirmed
 */
export async function onPaymentConfirmed(payment, order) {
    await notificationService.createNotification({
        userId: order.user_id,
        type: 'PAYMENT_SUCCESS',
        title: '💳 Payment Successful',
        message: `Payment for order #${order.order_number} has been confirmed!`,
        actionUrl: `/orders/${order.id}`,
        priority: 'HIGH',
        extraData: {
            orderId: order.id,
            paymentId: payment.id,
            amount: payment.amount
        }
    });
}

/**
 * Order Shipped
 */
export async function onOrderShipped(order, trackingInfo) {
    await notificationService.createNotification({
        userId: order.user_id,
        type: 'ORDER_SHIPPED',
        title: '🚚 Order Shipped',
        message: `Your order #${order.order_number} has been shipped! Track: ${trackingInfo.trackingNumber}`,
        actionUrl: `/orders/${order.id}/tracking`,
        priority: 'HIGH',
        extraData: {
            orderId: order.id,
            trackingNumber: trackingInfo.trackingNumber,
            courier: trackingInfo.courier
        }
    });
}

/**
 * Order Delivered
 */
export async function onOrderDelivered(order) {
    await notificationService.createNotification({
        userId: order.user_id,
        type: 'ORDER_DELIVERED',
        title: '✅ Order Delivered',
        message: `Your order #${order.order_number} has been delivered! Please confirm receipt.`,
        actionUrl: `/orders/${order.id}`,
        priority: 'HIGH',
        extraData: {
            orderId: order.id
        }
    });
}

/**
 * Order Cancelled
 */
export async function onOrderCancelled(order, reason) {
    await notificationService.createNotification({
        userId: order.user_id,
        type: 'ORDER_CANCELLED',
        title: '❌ Order Cancelled',
        message: `Your order #${order.order_number} has been cancelled. Reason: ${reason}`,
        actionUrl: `/orders/${order.id}`,
        priority: 'HIGH',
        extraData: {
            orderId: order.id,
            reason
        }
    });
}
