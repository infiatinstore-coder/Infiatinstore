/**
 * CRITICAL ALERT SYSTEM
 * Monitors critical events and sends email alerts
 * Project: infiatin.store
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'admin@infiatin.store';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alert@infiatin.store';

/**
 * Send critical alert email
 */
export async function sendCriticalAlert(alert) {
    const { severity, title, description, data, action } = alert;

    const severityColors = {
        CRITICAL: '#DC2626', // red-600
        HIGH: '#EA580C',     // orange-600
        MEDIUM: '#F59E0B',   // yellow-500
        LOW: '#10B981'       // green-500
    };

    const color = severityColors[severity] || '#6B7280';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 ${severity} ALERT</h1>
    </div>
    
    <div style="border: 2px solid ${color}; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: ${color}; margin-top: 0;">${title}</h2>
        
        <p style="font-size: 16px; margin: 15px 0;">
            <strong>Description:</strong><br>
            ${description}
        </p>
        
        ${data ? `
        <div style="background: #F3F4F6; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <strong>Details:</strong><br>
            ${Object.entries(data).map(([key, value]) => `
                <div style="margin: 5px 0;">
                    <span style="color: #6B7280;">${key}:</span> 
                    <strong>${value}</strong>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${action ? `
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0;">
            <strong>⚠️ Action Required:</strong><br>
            ${action}
        </div>
        ` : ''}
        
        <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
            <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
            <strong>System:</strong> infiatin.store Production
        </p>
    </div>
    
    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 20px;">
        This is an automated alert from infiatin.store monitoring system.
    </p>
</body>
</html>
    `;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: ALERT_EMAIL,
            subject: `🚨 [${severity}] ${title} - infiatin.store`,
            html: htmlContent
        });

        console.log(`[ALERT] Email sent - ${severity}: ${title}`);
        return { success: true };
    } catch (error) {
        console.error('[ALERT] Failed to send email:', error);
        // Don't throw - alerting failure shouldn't crash the app
        return { success: false, error: error.message };
    }
}

/**
 * CRITICAL ALERT: Payment SUCCESS but Order stuck PENDING_PAYMENT
 */
export async function alertPaymentOrderMismatch(data) {
    return sendCriticalAlert({
        severity: 'CRITICAL',
        title: 'Payment/Order Status Mismatch',
        description: 'Payment status is SUCCESS but order status is not PAID. This indicates a transaction processing failure.',
        data: {
            'Order Number': data.orderNumber,
            'Order Status': data.orderStatus,
            'Payment Status': data.paymentStatus,
            'Payment Method': data.paymentMethod,
            'Amount': `Rp ${data.amount.toLocaleString('id-ID')}`,
            'Time Since Payment': data.timeSincePayment
        },
        action: 'Manual intervention required: Check order state logs and manually update order status to PAID if payment is confirmed.'
    });
}

/**
 * CRITICAL ALERT: Stock negative
 */
export async function alertStockNegative(data) {
    return sendCriticalAlert({
        severity: 'CRITICAL',
        title: 'Negative Stock Detected - Overselling Risk',
        description: 'Product stock has gone negative, indicating overselling.',
        data: {
            'Product ID': data.productId,
            'Product Name': data.productName,
            'Variant ID': data.variantId || 'N/A',
            'Current Stock': data.currentStock,
            'Last Order': data.lastOrderNumber || 'Unknown'
        },
        action: 'Immediate action required: Check recent orders for this product. Manual stock correction needed. Investigate race condition.'
    });
}

/**
 * CRITICAL ALERT: Duplicate payment SUCCESS
 */
export async function alertDuplicatePayment(data) {
    return sendCriticalAlert({
        severity: 'CRITICAL',
        title: 'Duplicate Payment Detected',
        description: 'Multiple SUCCESS payments detected for a single order. Customer may have been charged twice.',
        data: {
            'Order Number': data.orderNumber,
            'Payment Count': data.paymentCount,
            'Total Amount': `Rp ${data.totalAmount.toLocaleString('id-ID')}`,
            'Payment IDs': data.paymentIds.join(', ')
        },
        action: 'URGENT: Verify with payment gateway. Initiate refund for duplicate charge if confirmed. Contact customer immediately.'
    });
}

/**
 * CRITICAL ALERT: Database connection issues
 */
export async function alertDatabaseDown(data) {
    return sendCriticalAlert({
        severity: 'CRITICAL',
        title: 'Database Connection Failure',
        description: 'Unable to connect to PostgreSQL database. All operations are blocked.',
        data: {
            'Error Message': data.errorMessage,
            'Last Successful Query': data.lastSuccessful || 'Unknown',
            'Failed Attempts': data.failedAttempts || 1
        },
        action: 'CRITICAL: Check database server status. Verify network connectivity. Check PostgreSQL service. Failover if needed.'
    });
}

/**
 * HIGH ALERT: Stock reduction retry exhausted
 */
export async function alertStockReductionFailed(data) {
    return sendCriticalAlert({
        severity: 'HIGH',
        title: 'Stock Reduction Failed After Retries',
        description: 'Payment is SUCCESS but stock reduction failed. Manual stock adjustment needed.',
        data: {
            'Order Number': data.orderNumber,
            'Product Name': data.productName,
            'Quantity': data.quantity,
            'Error': data.error,
            'Retry Count': data.retryCount
        },
        action: 'Manual stock reduction required. Use admin panel or direct database update. Then manually set order to PAID.'
    });
}

/**
 * HIGH ALERT: Order stuck in status
 */
export async function alertOrderStuck(data) {
    return sendCriticalAlert({
        severity: 'HIGH',
        title: `Order Stuck in ${data.status} Status`,
        description: `Order has been in ${data.status} status for longer than expected SLA.`,
        data: {
            'Order Number': data.orderNumber,
            'Current Status': data.status,
            'Time in Status': data.timeInStatus,
            'Expected SLA': data.expectedSla
        },
        action: `Review order ${data.orderNumber} and process or cancel as appropriate.`
    });
}

/**
 * Monitor function to be called periodically (e.g., via cron)
 */
export async function runCriticalMonitoring(prisma) {
    const alerts = [];

    try {
        // 1. Check Payment/Order mismatch
        const mismatchedOrders = await prisma.$queryRaw`
            SELECT o.id, o.order_number, o.status as order_status, 
                   p.status as payment_status, p.payment_method, p.amount, p.paid_at
            FROM orders o
            INNER JOIN payments p ON p.order_id = o.id
            WHERE p.status = 'SUCCESS' 
              AND o.status != 'PAID'
              AND p.paid_at < NOW() - INTERVAL '5 minutes'
        `;

        for (const order of mismatchedOrders) {
            const timeSince = Math.floor((Date.now() - new Date(order.paid_at).getTime()) / 1000 / 60);
            await alertPaymentOrderMismatch({
                orderNumber: order.order_number,
                orderStatus: order.order_status,
                paymentStatus: order.payment_status,
                paymentMethod: order.payment_method,
                amount: Number(order.amount),
                timeSincePayment: `${timeSince} minutes`
            });
            alerts.push({ type: 'payment_mismatch', orderNumber: order.order_number });
        }

        // 2. Check negative stock
        const negativeStockProducts = await prisma.$queryRaw`
            SELECT id, name, stock FROM products WHERE stock < 0
            UNION ALL
            SELECT pv.id, p.name || ' - ' || pv.name as name, pv.stock 
            FROM product_variants pv
            INNER JOIN products p ON p.id = pv.product_id
            WHERE pv.stock < 0
        `;

        for (const product of negativeStockProducts) {
            await alertStockNegative({
                productId: product.id,
                productName: product.name,
                currentStock: product.stock
            });
            alerts.push({ type: 'negative_stock', productId: product.id });
        }

        // 3. Check duplicate payments
        const duplicatePayments = await prisma.$queryRaw`
            SELECT o.order_number, COUNT(p.id) as payment_count, 
                   SUM(p.amount) as total_amount,
                   array_agg(p.id::text) as payment_ids
            FROM payments p
            INNER JOIN orders o ON o.id = p.order_id
            WHERE p.status = 'SUCCESS'
            GROUP BY o.id, o.order_number
            HAVING COUNT(p.id) > 1
        `;

        for (const dup of duplicatePayments) {
            await alertDuplicatePayment({
                orderNumber: dup.order_number,
                paymentCount: Number(dup.payment_count),
                totalAmount: Number(dup.total_amount),
                paymentIds: dup.payment_ids
            });
            alerts.push({ type: 'duplicate_payment', orderNumber: dup.order_number });
        }

        console.log(`[MONITORING] Completed. ${alerts.length} alerts sent.`);
        return { success: true, alertsSent: alerts.length, alerts };

    } catch (error) {
        console.error('[MONITORING] Error:', error);

        // Alert about monitoring failure itself
        if (error.code === 'ECONNREFUSED' || error.message.includes('database')) {
            await alertDatabaseDown({
                errorMessage: error.message,
                failedAttempts: 1
            });
        }

        return { success: false, error: error.message };
    }
}
