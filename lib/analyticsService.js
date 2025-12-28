/**
 * ANALYTICS SERVICE
 * Calculate and aggregate business metrics
 * Based on Claude.ai production spec
 */

import prisma from './prisma';
import { cache } from './cache';

export class AnalyticsService {

    /**
     * Calculate daily metrics for a specific date
     */
    async calculateDailyMetrics(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get orders for the day
        const orders = await prisma.orders.findMany({
            where: {
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // Calculate metrics
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
        const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

        // GMV = sum of all non-cancelled orders
        const totalGmv = orders
            .filter(o => o.status !== 'CANCELLED')
            .reduce((sum, o) => sum + Number(o.total), 0);

        // Revenue (platform fee 5%)
        const totalRevenue = totalGmv * 0.05;

        // AOV
        const avgOrderValue = totalOrders > 0 ? totalGmv / totalOrders : 0;

        // Customer metrics
        const newCustomers = await prisma.users.count({
            where: {
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const uniqueUserIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
        const returningCustomers = await prisma.orders.count({
            where: {
                user_id: { in: uniqueUserIds },
                created_at: { lt: startOfDay }
            }
        });

        // Upsert daily metrics
        await prisma.daily_metrics.upsert({
            where: { date: startOfDay },
            create: {
                date: startOfDay,
                total_gmv: totalGmv,
                total_revenue: totalRevenue,
                total_orders: totalOrders,
                completed_orders: completedOrders,
                cancelled_orders: cancelledOrders,
                average_order_value: avgOrderValue,
                new_customers: newCustomers,
                returning_customers: returningCustomers
            },
            update: {
                total_gmv: totalGmv,
                total_revenue: totalRevenue,
                total_orders: totalOrders,
                completed_orders: completedOrders,
                cancelled_orders: cancelledOrders,
                average_order_value: avgOrderValue,
                new_customers: newCustomers,
                returning_customers: returningCustomers
            }
        });

        return { date, totalGmv, totalOrders };
    }

    /**
     * Calculate seller metrics
     */
    async calculateSellerMetrics(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all sellers with orders
        const sellers = await prisma.orders.groupBy({
            by: ['seller_id'],
            where: {
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                seller_id: { not: null }
            }
        });

        for (const sellerGroup of sellers) {
            const sellerId = sellerGroup.seller_id;

            const orders = await prisma.orders.findMany({
                where: {
                    seller_id: sellerId,
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            });

            const totalOrders = orders.length;
            const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
            const totalGmv = orders.reduce((sum, o) => sum + Number(o.total), 0);
            const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

            await prisma.seller_metrics.upsert({
                where: {
                    seller_id_date: { seller_id: sellerId, date: startOfDay }
                },
                create: {
                    seller_id: sellerId,
                    date: startOfDay,
                    total_gmv: totalGmv,
                    total_orders: totalOrders,
                    completed_orders: completedOrders,
                    completion_rate: completionRate
                },
                update: {
                    total_gmv: totalGmv,
                    total_orders: totalOrders,
                    completed_orders: completedOrders,
                    completion_rate: completionRate
                }
            });
        }
    }

    /**
     * Update customer lifetime metrics
     */
    async updateCustomerMetrics(userId) {
        const orders = await prisma.orders.findMany({
            where: {
                user_id: userId,
                status: 'COMPLETED'
            },
            orderBy: { created_at: 'asc' }
        });

        if (orders.length === 0) return;

        const lifetimeValue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const totalOrders = orders.length;
        const avgOrderValue = lifetimeValue / totalOrders;

        const firstPurchase = orders[0];
        const lastPurchase = orders[orders.length - 1];

        const daysSinceLastOrder = Math.floor(
            (Date.now() - new Date(lastPurchase.created_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        // Determine segment
        let segment = 'NEW';
        if (daysSinceLastOrder > 180) segment = 'DORMANT';
        else if (daysSinceLastOrder > 90) segment = 'AT_RISK';
        else if (totalOrders >= 5 && lifetimeValue >= 1000000) segment = 'CHAMPION';
        else if (lifetimeValue >= 500000) segment = 'VIP';
        else if (daysSinceLastOrder <= 90) segment = 'ACTIVE';

        await prisma.customer_metrics.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                lifetime_value: lifetimeValue,
                total_orders: totalOrders,
                completed_orders: totalOrders,
                first_purchase_at: firstPurchase.created_at,
                last_purchase_at: lastPurchase.created_at,
                average_order_value: avgOrderValue,
                segment,
                days_since_last_order: daysSinceLastOrder
            },
            update: {
                lifetime_value: lifetimeValue,
                total_orders: totalOrders,
                completed_orders: totalOrders,
                last_purchase_at: lastPurchase.created_at,
                average_order_value: avgOrderValue,
                segment,
                days_since_last_order: daysSinceLastOrder
            }
        });
    }

    /**
     * Get dashboard overview (cached)
     */
    async getDashboardOverview(period = 'today') {
        const cacheKey = `dashboard:overview:${period}`;

        return await cache.remember(cacheKey, 60, async () => {
            let startDate, endDate;

            switch (period) {
                case 'today':
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date();
                    break;
                case 'week':
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                    endDate = new Date();
                    break;
                case 'month':
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 30);
                    endDate = new Date();
                    break;
                default:
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date();
            }

            const metrics = await prisma.daily_metrics.aggregate({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _sum: {
                    total_gmv: true,
                    total_orders: true,
                    new_customers: true,
                    returning_customers: true
                },
                _avg: {
                    average_order_value: true,
                    conversion_rate: true
                }
            });

            return {
                gmv: metrics._sum.total_gmv || 0,
                orders: metrics._sum.total_orders || 0,
                aov: metrics._avg.average_order_value || 0,
                newCustomers: metrics._sum.new_customers || 0,
                returningCustomers: metrics._sum.returning_customers || 0,
                conversionRate: metrics._avg.conversion_rate || 0
            };
        });
    }

    /**
     * Get sales trend data
     */
    async getSalesTrend(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = await prisma.daily_metrics.findMany({
            where: {
                date: { gte: startDate }
            },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                total_gmv: true,
                total_orders: true,
                average_order_value: true,
                new_customers: true,
                returning_customers: true
            }
        });

        return metrics;
    }

    /**
     * Get inventory alerts
     */
    async getInventoryAlerts() {
        const lowStock = await prisma.products.findMany({
            where: {
                stock: { lt: 10, gt: 0 },
                is_active: true
            },
            select: {
                id: true,
                name: true,
                sku: true,
                stock: true
            },
            take: 10
        });

        const outOfStock = await prisma.products.findMany({
            where: {
                stock: 0,
                is_active: true
            },
            select: {
                id: true,
                name: true,
                sku: true
            },
            take: 10
        });

        return { lowStock, outOfStock };
    }

    /**
     * Create analytics alert
     */
    async createAlert(data) {
        const alert = await prisma.analytics_alerts.create({
            data: {
                type: data.type,
                severity: data.severity,
                metric: data.metric,
                threshold: data.threshold,
                current_value: data.currentValue,
                entity_type: data.entityType,
                entity_id: data.entityId,
                message: data.message,
                metadata: data.metadata || {}
            }
        });

        // TODO: Send notification to admin (email/WhatsApp)

        return alert;
    }

    /**
     * Get unacknowledged alerts
     */
    async getUnacknowledgedAlerts() {
        return await prisma.analytics_alerts.findMany({
            where: { is_acknowledged: false },
            orderBy: [
                { severity: 'desc' },
                { created_at: 'desc' }
            ],
            take: 20
        });
    }
}

export const analyticsService = new AnalyticsService();
