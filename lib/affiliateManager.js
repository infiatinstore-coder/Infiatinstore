/**
 * AFFILIATE COMMISSION MANAGER
 * Attribution window, hold period, tiered commissions
 */

import prisma from './prisma';

const DEFAULT_CONFIG = {
    attributionWindow: 30,    // 30 days cookie
    holdPeriodDays: 14,       // 14 days hold after delivery
    minPayoutAmount: 100000,  // Rp 100K minimum
    tiers: {
        standard: 5.0,
        silver: 7.0,
        gold: 10.0
    }
};

export class AffiliateCommissionManager {
    constructor(config = DEFAULT_CONFIG) {
        this.config = config;
    }

    /**
     * Track affiliate click
     */
    async trackClick(referralCode, metadata) {
        const affiliate = await prisma.affiliates.findUnique({
            where: { referral_code: referralCode }
        });

        if (!affiliate || affiliate.status !== 'active') {
            throw new Error('Invalid or inactive affiliate code');
        }

        const clickId = `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.config.attributionWindow);

        await prisma.affiliate_referrals.create({
            data: {
                click_id: clickId,
                affiliate_id: affiliate.id,
                referral_code: referralCode,
                ip_address: metadata.ipAddress,
                user_agent: metadata.userAgent,
                referer: metadata.referer,
                utm_source: metadata.utmSource,
                utm_medium: metadata.utmMedium,
                utm_campaign: metadata.utmCampaign,
                expires_at: expiresAt
            }
        });

        await prisma.affiliates.update({
            where: { id: affiliate.id },
            data: { total_clicks: { increment: 1 } }
        });

        return clickId;
    }

    /**
     * Attribute order to affiliate
     */
    async attributeOrder(orderId, userId) {
        const referral = await prisma.affiliate_referrals.findFirst({
            where: {
                referred_user_id: userId,
                is_expired: false,
                expires_at: { gte: new Date() }
            },
            orderBy: { clicked_at: 'desc' }
        });

        if (!referral) return;

        await prisma.affiliate_referrals.update({
            where: { id: referral.id },
            data: {
                converted_at: new Date(),
                first_order_id: orderId
            }
        });

        await prisma.orders.update({
            where: { id: orderId },
            data: {
                referral_code: referral.referral_code,
                affiliate_id: referral.affiliate_id
            }
        });
    }

    /**
     * Create commission when order paid
     */
    async createCommission(orderId) {
        const order = await prisma.orders.findUnique({
            where: { id: orderId }
        });

        if (!order || !order.affiliate_id) return;

        const affiliate = await prisma.affiliates.findUnique({
            where: { id: order.affiliate_id }
        });

        if (!affiliate) return;

        const commissionRate = this.getCommissionRate(affiliate.tier);
        const commissionAmount = Number(order.total) * (commissionRate / 100);

        const eligibleAt = new Date();
        eligibleAt.setDate(eligibleAt.getDate() + this.config.holdPeriodDays);

        await prisma.affiliate_commissions.create({
            data: {
                affiliate_id: affiliate.id,
                order_id: order.id,
                order_amount: order.total,
                commission_rate: commissionRate,
                commission_amount: commissionAmount,
                status: 'PENDING',
                ordered_at: new Date(),
                paid_at: order.paid_at,
                eligible_at: eligibleAt,
                hold_until: eligibleAt,
                hold_reason: 'Awaiting order completion and refund window'
            }
        });

        await prisma.affiliates.update({
            where: { id: affiliate.id },
            data: {
                total_orders: { increment: 1 },
                total_revenue: { increment: order.total }
            }
        });
    }

    /**
     * Confirm commission after hold period
     */
    async confirmCommission(orderId) {
        const commission = await prisma.affiliate_commissions.findFirst({
            where: { order_id: orderId, status: 'PENDING' }
        });

        if (!commission) return;

        const now = new Date();
        const isEligible = commission.hold_until && commission.hold_until <= now;

        if (!isEligible) {
            console.log(`Commission for order ${orderId} still in hold period`);
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.affiliate_commissions.update({
                where: { id: commission.id },
                data: {
                    status: 'CONFIRMED',
                    confirmed_at: now,
                    claimed_at: now
                }
            });

            await tx.affiliates.update({
                where: { id: commission.affiliate_id },
                data: {
                    available_balance: { increment: commission.commission_amount },
                    total_commission: { increment: commission.commission_amount }
                }
            });
        });

        console.log(`Confirmed commission Rp ${commission.commission_amount} for affiliate ${commission.affiliate_id}`);
    }

    /**
     * Cancel commission (order refunded)
     */
    async cancelCommission(orderId, reason) {
        const commission = await prisma.affiliate_commissions.findFirst({
            where: {
                order_id: orderId,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });

        if (!commission) return;

        await prisma.$transaction(async (tx) => {
            if (commission.status === 'CONFIRMED') {
                await tx.affiliates.update({
                    where: { id: commission.affiliate_id },
                    data: {
                        available_balance: { decrement: commission.commission_amount },
                        total_commission: { decrement: commission.commission_amount }
                    }
                });
            }

            await tx.affiliate_commissions.update({
                where: { id: commission.id },
                data: {
                    status: 'CANCELLED',
                    cancelled_at: new Date(),
                    cancellation_reason: reason
                }
            });
        });
    }

    /**
     * Process eligible commissions (cron job)
     */
    async processEligibleCommissions() {
        const eligibleCommissions = await prisma.affiliate_commissions.findMany({
            where: {
                status: 'PENDING',
                eligible_at: { lte: new Date() }
            },
            include: { orders: true }
        });

        let processedCount = 0;

        for (const commission of eligibleCommissions) {
            if (commission.orders.status === 'COMPLETED') {
                await this.confirmCommission(commission.order_id);
                processedCount++;
            } else if (['CANCELLED', 'REFUNDED'].some(s => commission.orders.status.includes(s))) {
                await this.cancelCommission(commission.order_id, 'Order cancelled/refunded');
            }
        }

        return processedCount;
    }

    /**
     * Request payout
     */
    async requestPayout(affiliateId, amount, method, bankAccount) {
        const affiliate = await prisma.affiliates.findUnique({
            where: { id: affiliateId }
        });

        if (!affiliate) {
            return { success: false, error: 'Affiliate not found' };
        }

        if (amount < this.config.minPayoutAmount) {
            return {
                success: false,
                error: `Minimum payout Rp ${this.config.minPayoutAmount.toLocaleString()}`
            };
        }

        if (amount > Number(affiliate.available_balance)) {
            return { success: false, error: 'Insufficient balance' };
        }

        const commissions = await prisma.affiliate_commissions.findMany({
            where: { affiliate_id: affiliateId, status: 'CONFIRMED' },
            orderBy: { claimed_at: 'asc' }
        });

        let totalAmount = 0;
        const includedCommissions = [];

        for (const commission of commissions) {
            if (totalAmount + Number(commission.commission_amount) <= amount) {
                totalAmount += Number(commission.commission_amount);
                includedCommissions.push(commission.id);
            }
            if (totalAmount >= amount) break;
        }

        const platformFee = totalAmount * 0.02;
        const transferFee = 5000;
        const netAmount = totalAmount - platformFee - transferFee;

        const payout = await prisma.$transaction(async (tx) => {
            await tx.affiliate_commissions.updateMany({
                where: { id: { in: includedCommissions } },
                data: { status: 'PAID' }
            });

            await tx.affiliates.update({
                where: { id: affiliateId },
                data: {
                    available_balance: { decrement: totalAmount },
                    pending_balance: { increment: totalAmount }
                }
            });

            return await tx.affiliate_payouts.create({
                data: {
                    affiliate_id: affiliateId,
                    amount: totalAmount,
                    commissions: includedCommissions,
                    method,
                    bank_account: bankAccount,
                    platform_fee: platformFee,
                    transfer_fee: transferFee,
                    net_amount: netAmount,
                    status: 'pending'
                }
            });
        });

        return { success: true, payoutId: payout.id };
    }

    /**
     * Expire old referrals
     */
    async expireOldReferrals() {
        const result = await prisma.affiliate_referrals.updateMany({
            where: {
                is_expired: false,
                expires_at: { lte: new Date() }
            },
            data: { is_expired: true }
        });

        return result.count;
    }

    getCommissionRate(tier) {
        return this.config.tiers[tier] || this.config.tiers.standard;
    }
}

export const affiliateManager = new AffiliateCommissionManager();
