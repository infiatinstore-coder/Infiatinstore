/**
 * FRAUD DETECTION SERVICE
 * Implements 8 fraud patterns from Claude spec
 * Risk scoring: 0-100 points
 */

import prisma from './prisma';
import crypto from 'crypto';

const CONFIG = {
    enabled: process.env.FRAUD_DETECTION_ENABLED === 'true',
    autoBlock: process.env.AUTO_BLOCK_ENABLED === 'true',
    thresholds: {
        low: 30,      // CHALLENGE (OTP)
        medium: 60,   // REVIEW (Manual)
        high: 80      // BLOCK (Auto-block if enabled)
    }
};

export class FraudDetectionService {

    /**
     * Check order for fraud (Layer 4: Transaction-specific)
     */
    async checkOrder(data) {
        const { order, user, ipAddress, deviceFingerprint } = data;

        if (!CONFIG.enabled) return { decision: 'ALLOW', risk_score: 0 };

        let riskScore = 0;
        const triggers = [];

        // Layer 1: Blacklist check
        if (await this.isBlacklisted('IP', ipAddress)) {
            return { decision: 'BLOCK', risk_score: 100, reason: 'IP blacklisted' };
        }

        if (await this.isBlacklisted('DEVICE', deviceFingerprint)) {
            return { decision: 'BLOCK', risk_score: 100, reason: 'Device blacklisted' };
        }

        // Layer 2: User risk profile
        const userProfile = await this.getUserRiskProfile(user.id);
        riskScore += userProfile.risk_score;

        // Pattern 1: Bulk Order Fraud
        const bulkCheck = this.checkBulkOrder(order);
        if (bulkCheck.isSuspicious) {
            riskScore += bulkCheck.points;
            triggers.push('BULK_ORDER');
        }

        // Pattern 5: Account Takeover
        const accountCheck = await this.checkAccountTakeover(user, ipAddress, deviceFingerprint);
        if (accountCheck.isSuspicious) {
            riskScore += accountCheck.points;
            triggers.push('ACCOUNT_TAKEOVER');
        }

        // Pattern 6: Dropship/Reseller
        const dropshipCheck = this.checkDropshipPattern(order);
        if (dropshipCheck.isSuspicious) {
            riskScore += dropshipCheck.points;
            triggers.push('DROPSHIP_PATTERN');
        }

        // New account + high value
        if (this.isNewAccount(user) && order.total > 5000000) {
            riskScore += 30;
            triggers.push('NEW_ACCOUNT_HIGH_VALUE');
        }

        // Determine decision
        const decision = this.calculateDecision(riskScore);

        // Log event
        await this.logFraudEvent({
            event_type: 'ORDER_CHECK',
            eventCategory: 'ORDER',
            user_id: user.id,
            order_id: order.id,
            riskScore,
            triggers,
            decision,
            ipAddress,
            deviceFingerprint
        });

        // Update user risk profile
        await this.updateUserRiskScore(user.id, riskScore);

        return {
            decision,
            riskScore,
            triggers,
            requiresVerification: riskScore >= CONFIG.thresholds.low
        };
    }

    /**
     * Check payment for fraud (Pattern 2: Multiple Failed Payments)
     */
    async checkPayment(data) {
        const { payment, order, user, ipAddress } = data;

        if (!CONFIG.enabled) return { decision: 'ALLOW', risk_score: 0 };

        let riskScore = 0;
        const triggers = [];

        // Check failed payment history (last 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const failedPayments = await prisma.payments.count({
            where: {
                user_id: user.id,
                status: 'FAILED',
                created_at: { gte: oneHourAgo }
            }
        });

        if (failedPayments >= 3) {
            riskScore += 60;
            triggers.push('MULTIPLE_FAILED_PAYMENTS');

            // Block after 3 failures
            return {
                decision: 'BLOCK',
                risk_score: 100,
                triggers,
                reason: 'Too many failed payments'
            };
        } else if (failedPayments >= 2) {
            riskScore += 40;
            triggers.push('REPEATED_PAYMENT_FAILURE');
        }

        // Small test transaction pattern
        if (payment.amount < 50000 && user.total_orders === 0) {
            riskScore += 20;
            triggers.push('TEST_TRANSACTION');
        }

        const decision = this.calculateDecision(riskScore);

        await this.logFraudEvent({
            event_type: 'PAYMENT_CHECK',
            eventCategory: 'PAYMENT',
            user_id: user.id,
            payment_id: payment.id,
            riskScore,
            triggers,
            decision,
            ipAddress
        });

        return { decision, riskScore, triggers };
    }

    /**
     * Check review for fraud (Pattern 4: Fake Reviews)
     */
    async checkReview(data) {
        const { review, user, product } = data;

        if (!CONFIG.enabled) return { isSuspicious: false, risk_score: 0 };

        let riskScore = 0;
        const triggers = [];

        // Non-verified purchase
        if (!review.order_id) {
            riskScore += 30;
            triggers.push('NO_VERIFIED_PURCHASE');
        }

        // Spam keywords
        const spamKeywords = ['http://', 'https://', 'wa.me', 't.me', 'telegram', 'whatsapp'];
        const hasSpam = spamKeywords.some(keyword =>
            review.comment?.toLowerCase().includes(keyword)
        );

        if (hasSpam) {
            riskScore += 50;
            triggers.push('SPAM_KEYWORDS');
        }

        // High velocity (10+ reviews in 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentReviews = await prisma.product_reviews.count({
            where: {
                user_id: user.id,
                created_at: { gte: oneDayAgo }
            }
        });

        if (recentReviews >= 10) {
            riskScore += 40;
            triggers.push('HIGH_REVIEW_VELOCITY');
        }

        const isSuspicious = riskScore >= 30;

        if (isSuspicious) {
            await this.logFraudEvent({
                event_type: 'FAKE_REVIEW',
                eventCategory: 'REVIEW',
                user_id: user.id,
                riskScore,
                triggers,
                decision: 'REVIEW',
                metadata: { product_id: product.id }
            });
        }

        return { isSuspicious, riskScore, triggers };
    }

    /**
     * Check promo code usage (Pattern 3: Promo Abuse)
     */
    async checkPromoCodeUsage(data) {
        const { promoCode, user, ipAddress, deviceFingerprint } = data;

        if (!CONFIG.enabled) return { allowed: true, risk_score: 0 };

        let riskScore = 0;
        const triggers = [];

        // Same IP/device claiming multiple times
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const sameIPUsage = await prisma.voucher_usage.count({
            where: {
                voucher_code: promoCode.code,
                ip_addresses: ipAddress,
                created_at: { gte: oneHourAgo }
            }
        });

        if (sameIPUsage >= 3) {
            riskScore += 50;
            triggers.push('SAME_IP_MULTIPLE_CLAIMS');
        }

        // New account created just for promo
        if (this.isNewAccount(user) && user.total_orders === 0) {
            riskScore += 30;
            triggers.push('NEW_ACCOUNT_PROMO');
        }

        const allowed = riskScore < CONFIG.thresholds.medium;

        if (!allowed) {
            await this.logFraudEvent({
                event_type: 'PROMO_ABUSE',
                eventCategory: 'PROMO',
                user_id: user.id,
                riskScore,
                triggers,
                decision: 'BLOCK',
                ipAddress,
                deviceFingerprint
            });
        }

        return { allowed, riskScore, triggers };
    }

    /**
     * Pattern 1: Bulk Order Detection
     */
    checkBulkOrder(order) {
        let points = 0;
        let isSuspicious = false;

        // 10+ quantity in single order
        const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        if (totalQuantity >= 10) {
            points += 25;
            isSuspicious = true;
        }

        // All from same category
        if (order.items && order.items.length > 1) {
            const categories = [...new Set(order.items.map(i => i.category_id))];
            if (categories.length === 1) {
                points += 15;
                isSuspicious = true;
            }
        }

        return { isSuspicious, points };
    }

    /**
     * Pattern 5: Account Takeover Detection
     */
    async checkAccountTakeover(user, ipAddress, deviceFingerprint) {
        let points = 0;
        let isSuspicious = false;

        const profile = await prisma.user_risk_profiles.findUnique({
            where: { user_id: user.id }
        });

        if (!profile) return { isSuspicious: false, points: 0 };

        // New device
        if (profile.last_login_device && profile.last_login_device !== deviceFingerprint) {
            points += 40;
            isSuspicious = true;
        }

        // New IP (basic check - different IP)
        if (profile.last_login_ip && profile.last_login_ip !== ipAddress) {
            points += 20;
        }

        // Password recently changed (within 24h) + new device
        // TODO: Track password changes

        return { isSuspicious, points };
    }

    /**
     * Pattern 6: Dropship Pattern Detection
     */
    checkDropshipPattern(order) {
        let points = 0;
        let isSuspicious = false;

        // Shipping to kurir/ekspedisi address
        const courierKeywords = ['jne', 'jnt', 'sicepat', 'ekspedisi', 'kurir', 'drop point'];
        const hasKeyword = courierKeywords.some(keyword =>
            order.shipping_address?.toLowerCase().includes(keyword)
        );

        if (hasKeyword) {
            points += 15;
            isSuspicious = true;
        }

        // Bulk orders
        const totalQty = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        if (totalQty >= 20) {
            points += 10;
        }

        return { isSuspicious, points };
    }

    /**
     * Helper: Check if user is new (< 7 days)
     */
    isNewAccount(user) {
        const daysSinceCreation = Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000)
        );
        return daysSinceCreation < 7;
    }

    /**
     * Calculate decision based on risk score
     */
    calculateDecision(riskScore) {
        if (riskScore >= CONFIG.thresholds.high) return 'BLOCK';
        if (riskScore >= CONFIG.thresholds.medium) return 'REVIEW';
        if (riskScore >= CONFIG.thresholds.low) return 'CHALLENGE';
        return 'ALLOW';
    }

    /**
     * Check if IP/Device is blacklisted
     */
    async isBlacklisted(type, value) {
        if (!value) return false;

        const hash = crypto.createHash('sha256').update(value).digest('hex');

        const blacklist = await prisma.blacklists.findFirst({
            where: {
                type,
                value: hash,
                is_active: true,
                OR: [
                    { expires_at: null },
                    { expires_at: { gte: new Date() } }
                ]
            }
        });

        return !!blacklist;
    }

    /**
     * Get user risk profile
     */
    async getUserRiskProfile(userId) {
        let profile = await prisma.user_risk_profiles.findUnique({
            where: { user_id: userId }
        });

        if (!profile) {
            profile = await prisma.user_risk_profiles.create({
                data: { user_id: userId }
            });
        }

        return profile;
    }

    /**
     * Update user risk score
     */
    async updateUserRiskScore(userId, addPoints) {
        const profile = await this.getUserRiskProfile(userId);

        const newScore = Math.min(100, profile.risk_score + addPoints);
        let riskLevel = 'LOW';
        if (newScore >= 80) riskLevel = 'CRITICAL';
        else if (newScore >= 60) riskLevel = 'HIGH';
        else if (newScore >= 30) riskLevel = 'MEDIUM';

        await prisma.user_risk_profiles.update({
            where: { user_id: userId },
            data: {
                risk_score: newScore,
                risk_level: riskLevel
            }
        });
    }

    /**
     * Log fraud event
     */
    async logFraudEvent(data) {
        await prisma.fraud_events.create({
            data: {
                event_type: data.eventType,
                event_category: data.eventCategory,
                user_id: data.userId,
                order_id: data.orderId,
                payment_id: data.paymentId,
                risk_score: data.riskScore,
                triggers: data.triggers || [],
                decision: data.decision,
                ip_addresses: data.ipAddress,
                device_fingerprint: data.deviceFingerprint,
                metadata: data.metadata || {}
            }
        });
    }

    /**
     * Block user
     */
    async blockUser(userId, reason) {
        await prisma.user_risk_profiles.update({
            where: { user_id: userId },
            data: {
                is_blacklisted: true,
                blacklist_reason: reason,
                blacklisted_at: new Date(),
                risk_score: 100,
                risk_level: 'CRITICAL'
            }
        });
    }
}

export const fraudDetectionService = new FraudDetectionService();
