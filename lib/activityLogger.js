import prisma from './prisma';

/**
 * ACTIVITY LOGGING HELPER
 * For audit trail and fraud investigation
 */

/**
 * Log critical activity
 * @param {string} action - Action name (e.g., 'ORDER_STATUS_CHANGED', 'PAYMENT_RECEIVED')
 * @param {string} entityType - Type of entity (e.g., 'ORDER', 'PAYMENT', 'USER')
 * @param {string} entityId - ID of the entity
 * @param {string|null} userId - User who performed the action (null for system)
 * @param {object|null} metadata - Additional data
 * @param {string|null} ipAddress - IP address of the user
 * @param {string|null} userAgent - User agent string
 */
export async function logActivity({
    action,
    entityType,
    entityId,
    userId = null,
    metadata = null,
    ipAddress = null,
    userAgent = null
}) {
    try {
        await prisma.activity_logs.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                metadata,
                ipAddress,
                userAgent
            }
        });
    } catch (error) {
        // Log to console but don't fail the main operation
        console.error('[ActivityLog] Failed to log activity:', error.message, {
            action,
            entityType,
            entityId
        });
    }
}

/**
 * Log order status change
 */
export async function logOrderStatusChange(orderId, fromStatus, toStatus, changedBy, reason = null) {
    await logActivity({
        action: 'ORDER_STATUS_CHANGED',
        entity_type: 'ORDER',
        entity_id: orderId,
        user_id: changedBy === 'SYSTEM' ? null : changedBy,
        metadata: {
            fromStatus,
            toStatus,
            reason,
            changedBy
        }
    });
}

/**
 * Log payment received
 */
export async function logPaymentReceived(orderId, paymentMethod, amount, transactionId) {
    await logActivity({
        action: 'PAYMENT_RECEIVED',
        entity_type: 'PAYMENT',
        entity_id: orderId,
        user_id: null, // System action
        metadata: {
            paymentMethod,
            amount: Number(amount),
            transactionId
        }
    });
}

/**
 * Log admin login
 */
export async function logAdminLogin(userId, ipAddress, userAgent, success = true) {
    await logActivity({
        action: success ? 'ADMIN_LOGIN_SUCCESS' : 'ADMIN_LOGIN_FAILED',
        entity_type: 'USER',
        entity_id: userId,
        userId,
        ipAddress,
        userAgent
    });
}

/**
 * Log product price change
 */
export async function logPriceChange(productId, oldPrice, newPrice, changedBy) {
    await logActivity({
        action: 'PRODUCT_PRICE_CHANGED',
        entity_type: 'PRODUCT',
        entity_id: productId,
        user_id: changedBy,
        metadata: {
            oldPrice: Number(oldPrice),
            newPrice: Number(newPrice)
        }
    });
}

/**
 * Log refund approval
 */
export async function logRefundApproval(refundId, orderId, amount, approvedBy, status) {
    await logActivity({
        action: 'REFUND_STATUS_CHANGED',
        entity_type: 'REFUND',
        entity_id: refundId,
        user_id: approvedBy,
        metadata: {
            orderId,
            amount: Number(amount),
            status
        }
    });
}

/**
 * Log transaction guard block (security event)
 */
export async function logTransactionGuardBlock(userId, role, endpoint) {
    await logActivity({
        action: 'TRANSACTION_GUARD_BLOCKED',
        entity_type: 'SECURITY',
        entity_id: userId,
        userId,
        metadata: {
            role,
            endpoint,
            reason: 'Role not allowed to transact'
        }
    });
}

/**
 * Get activity logs for an entity
 */
export async function getActivityLogs(entityType, entityId, limit = 50) {
    return await prisma.activity_logs.findMany({
        where: {
            entityType,
            entityId
        },
        orderBy: {
            created_at: 'desc'
        },
        take: limit
    });
}
