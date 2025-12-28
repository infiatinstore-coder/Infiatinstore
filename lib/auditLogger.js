/**
 * AUDIT LOGGER
 * Track all critical actions for security and compliance
 */

import prisma from './prisma';

/**
 * Log an audit event
 */
export async function logAudit(event) {
    const {
        userId,
        action,
        resource,
        ipAddress,
        userAgent,
        metadata
    } = event;

    await prisma.audit_logs.create({
        data: {
            user_id: userId,
            action,
            resource,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: metadata || {}
        }
    });

    // Alert on suspicious activity
    if (action === 'login_failed' && metadata?.attempts > 5) {
        console.warn(`🚨 Security Alert: Brute force detected for user ${userId}`);
        // Send alert to admin
    }

    if (action === 'order_cancelled' && metadata?.value > 10000000) {
        console.warn(`🚨 High-value order cancelled: ${resource}`);
    }
}

/**
 * Convenience functions for common actions
 */
export async function logOrderCreated(orderId, userId, amount, request) {
    await logAudit({
        userId,
        action: 'order_created',
        resource: `order:${orderId}`,
        ip_address: request?.headers?.['x-forwarded-for'] || request?.ip,
        user_agent: request?.headers?.['user-agent'],
        metadata: {
            amount: Number(amount),
            timestamp: new Date().toISOString()
        }
    });
}

export async function logPaymentProcessed(orderId, userId, transactionId, amount) {
    await logAudit({
        userId,
        action: 'payment_processed',
        resource: `order:${orderId}`,
        metadata: {
            transactionId,
            amount: Number(amount),
            method: 'midtrans'
        }
    });
}

export async function logProductUpdated(productId, userId, changes) {
    await logAudit({
        userId,
        action: 'product_updated',
        resource: `product:${productId}`,
        metadata: changes
    });
}

export async function logUserAction(userId, action, resource, metadata = {}) {
    await logAudit({
        userId,
        action,
        resource,
        metadata
    });
}

/**
 * Get audit trail for a resource
 */
export async function getAuditTrail(resource, limit = 50) {
    return await prisma.audit_logs.findMany({
        where: { resource },
        orderBy: { created_at: 'desc' },
        take: limit
    });
}

/**
 * Get user activity
 */
export async function getUserActivity(userId, limit = 100) {
    return await prisma.audit_logs.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit
    });
}

/**
 * Detect suspicious patterns
 */
export async function detectSuspiciousActivity() {
    // Failed logins in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const failedLogins = await prisma.audit_logs.groupBy({
        by: ['user_id'],
        where: {
            action: 'login_failed',
            created_at: { gte: oneHourAgo }
        },
        _count: true,
        having: {
            user_id: {
                _count: {
                    gt: 5
                }
            }
        }
    });

    return {
        failedLogins,
        timestamp: new Date()
    };
}
