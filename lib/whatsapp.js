/**
 * WhatsApp Notification via n8n Webhooks
 * Sends notifications to n8n which forwards to WAHA for WhatsApp delivery
 */

// Webhook URLs from environment
const WEBHOOKS = {
    OTP: process.env.N8N_WEBHOOK_OTP,
    ORDER_CREATED: process.env.N8N_WEBHOOK_ORDER_CREATED,
    ORDER_SHIPPED: process.env.N8N_WEBHOOK_ORDER_SHIPPED,
    ORDER_COMPLETED: process.env.N8N_WEBHOOK_ORDER_COMPLETED,
    ORDER_CANCELLED: process.env.N8N_WEBHOOK_ORDER_CANCELLED,
    PAYMENT_SUCCESS: process.env.N8N_WEBHOOK_PAYMENT_SUCCESS,
    PAYMENT_EXPIRED: process.env.N8N_WEBHOOK_PAYMENT_EXPIRED,
    REFUND_REQUESTED: process.env.N8N_WEBHOOK_REFUND_REQUESTED,
    SECURITY_ALERT: process.env.N8N_WEBHOOK_SECURITY_ALERT,
    ERROR_SPIKE: process.env.N8N_WEBHOOK_ERROR_SPIKE,
};

/**
 * Send webhook to n8n
 */
async function sendToN8n(webhookUrl, data) {
    if (!webhookUrl) {
        console.log('[WhatsApp] Webhook URL not configured, skipping notification');
        return { success: false, reason: 'webhook_not_configured' };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`n8n webhook failed: ${response.status}`);
        }

        console.log('[WhatsApp] Notification sent successfully');
        return { success: true };
    } catch (error) {
        console.error('[WhatsApp] Failed to send notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Format phone number to international format (628xxx)
 */
function formatPhoneNumber(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

/**
 * Send OTP verification
 */
export async function sendWhatsAppNotification(phone, type, data) {
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) {
        return { success: false, reason: 'no_phone' };
    }

    if (type === 'OTP_VERIFICATION') {
        return sendToN8n(WEBHOOKS.OTP, {
            type: 'otp_verification',
            phone: formattedPhone,
            otp: data.otp,
        });
    }

    return { success: false, reason: 'unknown_type' };
}

/**
 * Send order created notification
 */
export async function sendOrderNotification(order) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;
    if (!phone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.ORDER_CREATED, {
        type: 'order_created',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        total: order.total,
        itemsCount: order.items?.length || 0,
        payment_method: order.payment_method,
    });
}

/**
 * Send payment success notification
 */
export async function sendPaymentNotification(order) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;
    if (!phone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.PAYMENT_SUCCESS, {
        type: 'payment_success',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        total: order.total,
    });
}

/**
 * Send shipping notification
 */
export async function sendShippingNotification(order, trackingNumber, courier) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;
    if (!phone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.ORDER_SHIPPED, {
        type: 'order_shipped',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        tracking_number: trackingNumber,
        courier: courier?.toUpperCase() || 'KURIR',
    });
}

/**
 * Send order completed notification
 */
export async function sendOrderCompletedNotification(order) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;
    if (!phone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.ORDER_COMPLETED, {
        type: 'order_completed',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
    });
}

/**
 * Send order cancelled notification
 */
export async function sendOrderCancelledNotification(order, reason) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;
    if (!phone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.ORDER_CANCELLED, {
        type: 'order_cancelled',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        reason: reason || 'Dibatalkan',
    });
}

/**
 * Send payment expired notification
 */
export async function sendPaymentExpiredNotification(order) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;
    if (!phone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.PAYMENT_EXPIRED, {
        type: 'payment_expired',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        total: order.total,
    });
}

/**
 * Send refund requested notification
 */
export async function sendRefundNotification(order, refundAmount, reason) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;
    if (!phone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.REFUND_REQUESTED, {
        type: 'refund_requested',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        refund_amount: refundAmount,
        reason: reason,
    });
}

/**
 * Send security alert (for admin)
 */
export async function sendSecurityAlert(adminPhone, alertData) {
    if (!adminPhone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.SECURITY_ALERT, {
        type: 'security_alert',
        phone: formatPhoneNumber(adminPhone),
        ...alertData,
    });
}

/**
 * Send error spike alert (for admin)
 */
export async function sendErrorSpikeAlert(adminPhone, errorData) {
    if (!adminPhone) {
        return { success: false, reason: 'no_phone' };
    }

    return sendToN8n(WEBHOOKS.ERROR_SPIKE, {
        type: 'error_spike',
        phone: formatPhoneNumber(adminPhone),
        ...errorData,
    });
}
