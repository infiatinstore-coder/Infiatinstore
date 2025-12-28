/**
 * WEBHOOK LOGGER
 * Comprehensive logging for all webhook events
 */

import prisma from './prisma';

/**
 * Log webhook event
 */
export async function logWebhook(provider, event, payload, status = 'success', error = null) {
    await prisma.webhook_logs.create({
        data: {
            provider,
            event,
            payload,
            status,
            error: error?.message || null,
            stack_trace: error?.stack || null
        }
    });
}

/**
 * Get webhook logs for debugging
 */
export async function getWebhookLogs(provider = null, limit = 50) {
    return await prisma.webhook_logs.findMany({
        where: provider ? { provider } : {},
        orderBy: { processed_at: 'desc' },
        take: limit
    });
}

/**
 * Get failed webhooks
 */
export async function getFailedWebhooks(provider = null) {
    return await prisma.webhook_logs.findMany({
        where: {
            status: 'failed',
            ...(provider && { provider })
        },
        orderBy: { processed_at: 'desc' }
    });
}

/**
 * Webhook statistics
 */
export async function getWebhookStats(provider, since = null) {
    const where = {
        provider,
        ...(since && { processed_at: { gte: since } })
    };

    const total = await prisma.webhook_logs.count({ where });
    const success = await prisma.webhook_logs.count({ where: { ...where, status: 'success' } });
    const failed = await prisma.webhook_logs.count({ where: { ...where, status: 'failed' } });

    return {
        total,
        success,
        failed,
        successRate: total > 0 ? (success / total * 100).toFixed(2) + '%' : '0%'
    };
}
