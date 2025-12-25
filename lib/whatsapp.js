/**
 * WhatsApp Notification via n8n Webhooks
 * Sends notifications to n8n which forwards to WAHA for WhatsApp delivery
 */

const N8N_WEBHOOK_ORDER_CREATED = process.env.N8N_WEBHOOK_ORDER_CREATED;
const N8N_WEBHOOK_PAYMENT_SUCCESS = process.env.N8N_WEBHOOK_PAYMENT_SUCCESS;
const N8N_WEBHOOK_ORDER_SHIPPED = process.env.N8N_WEBHOOK_ORDER_SHIPPED;
const N8N_WEBHOOK_OTP = process.env.N8N_WEBHOOK_OTP;

/**
 * Send webhook to n8n
 * @param {string} webhookUrl - n8n webhook URL
 * @param {object} data - Payload data
 */
async function sendToN8n(webhookUrl, data) {
    if (!webhookUrl) {
        console.log('[WhatsApp] Webhook URL not configured, skipping notification');
        return { success: false, reason: 'webhook_not_configured' };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`n8n webhook failed: ${response.status}`);
        }

        console.log(`[WhatsApp] Notification sent successfully to n8n`);
        return { success: true };
    } catch (error) {
        console.error('[WhatsApp] Failed to send notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send order created notification
 * @param {object} order - Order object with customer info
 */
export async function sendOrderNotification(order) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;

    if (!phone) {
        console.log('[WhatsApp] No phone number available for order notification');
        return { success: false, reason: 'no_phone' };
    }

    const payload = {
        type: 'order_created',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        total: order.total,
        itemsCount: order.items?.length || 0,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt || new Date().toISOString(),
    };

    return sendToN8n(N8N_WEBHOOK_ORDER_CREATED, payload);
}

/**
 * Send payment success notification
 * @param {object} order - Order object with payment info
 */
export async function sendPaymentNotification(order) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;

    if (!phone) {
        console.log('[WhatsApp] No phone number available for payment notification');
        return { success: false, reason: 'no_phone' };
    }

    const payload = {
        type: 'payment_success',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        total: order.total,
        paymentMethod: order.paymentMethod,
        paidAt: new Date().toISOString(),
    };

    return sendToN8n(N8N_WEBHOOK_PAYMENT_SUCCESS, payload);
}

/**
 * Send shipping notification with tracking number
 * @param {object} order - Order object
 * @param {string} trackingNumber - Resi number
 * @param {string} courier - Courier name (JNE, J&T, etc)
 */
export async function sendShippingNotification(order, trackingNumber, courier) {
    const phone = order.guestPhone || order.user?.phone || order.address?.phone;

    if (!phone) {
        console.log('[WhatsApp] No phone number available for shipping notification');
        return { success: false, reason: 'no_phone' };
    }

    const payload = {
        type: 'order_shipped',
        phone: formatPhoneNumber(phone),
        orderNumber: order.orderNumber,
        customerName: order.guestName || order.user?.name || 'Pelanggan',
        trackingNumber: trackingNumber,
        courier: courier?.toUpperCase() || 'KURIR',
        shippedAt: new Date().toISOString(),
    };

    return sendToN8n(N8N_WEBHOOK_ORDER_SHIPPED, payload);
}

/**
 * Format phone number to international format (628xxx)
 * @param {string} phone - Phone number
 */
function formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Convert 08xxx to 628xxx
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    }

    // Add 62 if not present
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }

    return cleaned;
}

/**
 * Send WhatsApp notification (generic function for OTP, etc)
 * @param {string} phone - Phone number
 * @param {string} type - Notification type (OTP_VERIFICATION, etc)
 * @param {object} data - Additional data
 */
export async function sendWhatsAppNotification(phone, type, data) {
    const formattedPhone = formatPhoneNumber(phone);

    if (!formattedPhone) {
        console.log('[WhatsApp] No phone number provided');
        return { success: false, reason: 'no_phone' };
    }

    if (type === 'OTP_VERIFICATION') {
        const payload = {
            type: 'otp_verification',
            phone: formattedPhone,
            otp: data.otp,
            message: data.message,
        };

        return sendToN8n(N8N_WEBHOOK_OTP, payload);
    }

    // Default: unknown type
    console.log(`[WhatsApp] Unknown notification type: ${type}`);
    return { success: false, reason: 'unknown_type' };
}
