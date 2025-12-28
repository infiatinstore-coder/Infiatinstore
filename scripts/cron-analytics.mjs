/**
 * ANALYTICS CRON JOBS
 * Daily batch processing at 2 AM
 */

import { analyticsService } from '../lib/analyticsService.js';
import prisma from '../lib/prisma.js';

/**
 * Process yesterday's metrics
 */
export async function processDailyMetrics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    console.log(`Processing metrics for ${yesterday.toDateString()}...`);

    // Calculate daily aggregates
    await analyticsService.calculateDailyMetrics(yesterday);
    await analyticsService.calculateSellerMetrics(yesterday);

    console.log('✅ Daily metrics calculated');
}

/**
 * Update all customer lifetime metrics
 */
export async function updateAllCustomerMetrics() {
    const users = await prisma.users.findMany({
        where: {
            orders: { some: {} }
        },
        select: { id: true }
    });

    console.log(`Updating metrics for ${users.length} customers...`);

    for (const user of users) {
        await analyticsService.updateCustomerMetrics(user.id);
    }

    console.log('✅ Customer metrics updated');
}

/**
 * Check critical metrics and create alerts
 */
export async function checkCriticalMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check cancellation rate
    const orders = await prisma.orders.groupBy({
        by: ['status'],
        where: {
            created_at: { gte: today }
        },
        _count: true
    });

    const total = orders.reduce((sum, o) => sum + o._count, 0);
    const cancelled = orders.find(o => o.status === 'CANCELLED')?._count || 0;
    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

    if (cancellationRate > 20) {
        await analyticsService.createAlert({
            type: 'HIGH_CANCELLATION',
            severity: 'CRITICAL',
            metric: 'cancellation_rate',
            threshold: 20,
            currentValue: cancellationRate,
            message: `High cancellation rate today: ${cancellationRate.toFixed(2)}%`
        });
    }

    // Check low stock products
    const lowStockCount = await prisma.products.count({
        where: {
            stock: { lt: 10, gt: 0 },
            is_active: true
        }
    });

    if (lowStockCount > 10) {
        await analyticsService.createAlert({
            type: 'LOW_STOCK',
            severity: 'WARNING',
            metric: 'inventory_level',
            threshold: 10,
            currentValue: lowStockCount,
            message: `${lowStockCount} products are low on stock`
        });
    }

    console.log('✅ Critical metrics checked');
}

/**
 * Run all analytics jobs
 */
export async function runAnalyticsJobs() {
    console.log('📊 Running analytics jobs...');

    try {
        await processDailyMetrics();
        await updateAllCustomerMetrics();
        await checkCriticalMetrics();

        console.log('✅ All analytics jobs completed');
    } catch (error) {
        console.error('❌ Analytics job error:', error);
        throw error;
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runAnalyticsJobs()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
