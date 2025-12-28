/**
 * NOTIFICATION SERVICE
 * Core notification logic with multi-channel delivery
 */

import prisma from './prisma';
import { pubsub } from './pubsub';
import { emailService } from './emailService';

export class NotificationService {

    /**
     * Create notification
     */
    async createNotification(data) {
        const {
            userId,
            type,
            title,
            message,
            icon,
            priority = 'NORMAL',
            actionUrl,
            extraData,
            expiresInDays = 30
        } = data;

        // Check user preferences
        const preferences = await this.getUserPreferences(userId);

        if (!this.shouldNotify(preferences, type)) {
            return null; // User opted out of this type
        }

        // Create notification
        const notification = await prisma.notifications.create({
            data: {
                user_id: userId,
                type,
                title,
                message,
                icon,
                priority,
                action_url: actionUrl,
                data: extraData || {},
                expires_at: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null
            }
        });

        // Broadcast via SSE
        pubsub.publish(`notifications:${userId}`, notification);

        // Send email if enabled
        if (preferences.enable_email && ['HIGH', 'URGENT'].includes(priority)) {
            await this.sendEmailNotification(userId, notification);
        }

        return notification;
    }

    /**
     * Get user preferences
     */
    async getUserPreferences(userId) {
        let prefs = await prisma.notification_preferences.findUnique({
            where: { user_id: userId }
        });

        if (!prefs) {
            prefs = await prisma.notification_preferences.create({
                data: { user_id: userId }
            });
        }

        return prefs;
    }

    /**
     * Check if should notify based on preferences
     */
    shouldNotify(preferences, type) {
        // Check if in quiet hours
        if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
            const now = new Date().getHours();
            const start = preferences.quiet_hours_start;
            const end = preferences.quiet_hours_end;

            // Handle overnight quiet hours (e.g., 22-7)
            const isQuietTime = start > end
                ? (now >= start || now < end)
                : (now >= start && now < end);

            if (isQuietTime) return false;
        }

        // Check in-app enabled
        if (!preferences.enable_in_app) return false;

        // Check category preferences
        if (type.startsWith('ORDER_') && !preferences.enable_orders) return false;
        if (type.startsWith('PRODUCT_') && !preferences.enable_products) return false;
        if (type.startsWith('REVIEW_') && !preferences.enable_reviews) return false;
        if (type.includes('SALE') || type.includes('PROMO')) {
            if (!preferences.enable_marketing) return false;
        }
        if (type.includes('LOGIN') || type.includes('PASSWORD')) {
            if (!preferences.enable_security) return false;
        }

        return true;
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(userId, notification) {
        try {
            const user = await prisma.users.findUnique({
                where: { id: userId },
                select: { email: true, name: true }
            });

            if (!user?.email) return;

            await emailService.send({
                to: user.email,
                subject: notification.title,
                html: `
                    <h2>${notification.icon || ''} ${notification.title}</h2>
                    <p>${notification.message}</p>
                    ${notification.action_url ? `
                        <p><a href="${process.env.NEXT_PUBLIC_URL}${notification.action_url}">View Details</a></p>
                    ` : ''}
                `
            });
        } catch (error) {
            console.error('Email notification error:', error);
        }
    }

    /**
     * Get notifications for user
     */
    async getNotifications(userId, limit = 20, offset = 0) {
        return await prisma.notifications.findMany({
            where: {
                user_id: userId,
                OR: [
                    { expires_at: null },
                    { expires_at: { gte: new Date() } }
                ]
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset
        });
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        return await prisma.notifications.count({
            where: {
                user_id: userId,
                is_read: false,
                OR: [
                    { expires_at: null },
                    { expires_at: { gte: new Date() } }
                ]
            }
        });
    }

    /**
     * Mark as read
     */
    async markAsRead(notificationId) {
        return await prisma.notifications.update({
            where: { id: notificationId },
            data: {
                is_read: true,
                read_at: new Date()
            }
        });
    }

    /**
     * Mark all as read
     */
    async markAllAsRead(userId) {
        return await prisma.notifications.updateMany({
            where: {
                user_id: userId,
                is_read: false
            },
            data: {
                is_read: true,
                read_at: new Date()
            }
        });
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        return await prisma.notifications.delete({
            where: { id: notificationId }
        });
    }

    /**
     * Cleanup expired notifications
     */
    async cleanupExpired() {
        const result = await prisma.notifications.deleteMany({
            where: {
                expires_at: {
                    lte: new Date()
                }
            }
        });

        return result.count;
    }

    /**
     * Update user preferences
     */
    async updatePreferences(userId, updates) {
        return await prisma.notification_preferences.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                ...updates
            },
            update: updates
        });
    }
}

export const notificationService = new NotificationService();
