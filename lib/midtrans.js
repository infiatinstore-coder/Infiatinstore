import midtransClient from 'midtrans-client';
import crypto from 'crypto';

// Initialize Snap client
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * Create Midtrans transaction
 * @param {Object} order - Order object from database with items, user, and address
 * @returns {Promise<Object>} - { token, redirect_url }
 */
export async function createMidtransTransaction(order) {
    // Validate order total
    if (!order.total || order.total <= 0) {
        throw new Error('Invalid order total');
    }

    // Build item details
    const itemDetails = order.items.map(item => ({
        id: item.productId,
        price: Math.floor(Number(item.priceAtPurchase)),
        quantity: item.quantity,
        name: item.productName.substring(0, 50), // Max 50 chars
    }));

    // Add shipping cost as item
    if (order.shippingCost && order.shippingCost > 0) {
        itemDetails.push({
            id: 'SHIPPING',
            price: Math.floor(Number(order.shippingCost)),
            quantity: 1,
            name: `Shipping - ${order.courierService || 'Standard'}`,
        });
    }

    // Add tax as item
    if (order.tax && order.tax > 0) {
        itemDetails.push({
            id: 'TAX',
            price: Math.floor(Number(order.tax)),
            quantity: 1,
            name: 'PPN 11%',
        });
    }

    // Add discount as negative item
    if (order.discount && order.discount > 0) {
        itemDetails.push({
            id: 'DISCOUNT',
            price: -Math.floor(Number(order.discount)),
            quantity: 1,
            name: 'Discount',
        });
    }

    // Split customer name
    const nameParts = order.user.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';

    // Build transaction parameter
    const parameter = {
        transaction_details: {
            order_id: order.orderNumber,
            gross_amount: Math.floor(Number(order.total)), // Must be integer
        },
        customer_details: {
            first_name: firstName,
            last_name: lastName,
            email: order.user.email,
            phone: order.user.phone || order.address?.phone || '08123456789',
        },
        item_details: itemDetails,
    };

    // Add shipping address if available
    if (order.address) {
        parameter.shipping_address = {
            first_name: order.address.recipientName || firstName,
            phone: order.address.phone,
            address: order.address.fullAddress,
            city: order.address.city,
            postal_code: order.address.postalCode,
            country_code: 'IDN',
        };
    }

    // Create transaction
    const transaction = await snap.createTransaction(parameter);
    return transaction;
}

/**
 * Verify Midtrans notification signature
 * @param {Object} notification - Notification payload from Midtrans
 * @returns {boolean}
 */
export function verifyMidtransSignature(notification) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
        console.error('MIDTRANS_SERVER_KEY not configured');
        return false;
    }

    const hash = crypto
        .createHash('sha512')
        .update(`${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`)
        .digest('hex');

    return hash === notification.signature_key;
}

/**
 * Map Midtrans transaction status to our payment status
 * @param {string} transactionStatus - Midtrans transaction_status
 * @param {string} fraudStatus - Midtrans fraud_status
 * @returns {Object} - { paymentStatus, orderStatus }
 */
export function mapMidtransStatus(transactionStatus, fraudStatus) {
    let paymentStatus = 'PENDING';
    let orderStatus = 'PENDING_PAYMENT';

    if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') {
            paymentStatus = 'SUCCESS';
            orderStatus = 'PAID';
        } else if (fraudStatus === 'challenge') {
            paymentStatus = 'PENDING';
            orderStatus = 'PENDING_PAYMENT';
        }
    } else if (transactionStatus === 'settlement') {
        paymentStatus = 'SUCCESS';
        orderStatus = 'PAID';
    } else if (transactionStatus === 'pending') {
        paymentStatus = 'PENDING';
        orderStatus = 'PENDING_PAYMENT';
    } else if (transactionStatus === 'deny') {
        paymentStatus = 'FAILED';
        orderStatus = 'CANCELLED';
    } else if (transactionStatus === 'expire') {
        paymentStatus = 'EXPIRED';
        orderStatus = 'CANCELLED';
    } else if (transactionStatus === 'cancel') {
        paymentStatus = 'FAILED';
        orderStatus = 'CANCELLED';
    }

    return { paymentStatus, orderStatus };
}

