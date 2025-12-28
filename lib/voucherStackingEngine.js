/**
 * VOUCHER STACKING ENGINE
 * Priority-based calculation with Tokopedia/Shopee-style rules
 */

import prisma from './prisma';

export class VoucherStackingEngine {

    async calculateDiscount(cart, voucherCodes) {
        const errors = [];

        // 1. Fetch vouchers
        const vouchers = await this.fetchVouchers(voucherCodes);

        // 2. Validate eligibility
        const eligibleVouchers = [];
        for (const voucher of vouchers) {
            const validation = await this.validateVoucher(voucher, cart);
            if (validation.isValid) {
                eligibleVouchers.push(voucher);
            } else {
                errors.push(`${voucher.code}: ${validation.reason}`);
            }
        }

        // 3. Check stacking compatibility
        const stackingValidation = this.validateStacking(eligibleVouchers);
        if (!stackingValidation.isValid) {
            return {
                appliedVouchers: [],
                totalDiscount: 0,
                shippingDiscount: 0,
                itemsDiscount: 0,
                cashbackAmount: 0,
                finalTotal: cart.subtotal + cart.shippingCost,
                breakdown: {
                    subtotal: cart.subtotal,
                    itemsDiscount: 0,
                    shipping_cost: cart.shippingCost,
                    shippingDiscount: 0,
                    total: cart.subtotal + cart.shippingCost
                },
                errors: [...errors, stackingValidation.reason]
            };
        }

        // 4. Sort by priority (higher = applied first)
        const sortedVouchers = eligibleVouchers.sort((a, b) =>
            (b.stack_priority || 0) - (a.stack_priority || 0)
        );

        // 5. Apply vouchers sequentially
        const appliedVouchers = [];
        let runningSubtotal = cart.subtotal;
        let runningShippingCost = cart.shippingCost;
        let totalItemsDiscount = 0;
        let totalShippingDiscount = 0;
        let totalCashback = 0;

        for (const voucher of sortedVouchers) {
            const discount = this.calculateVoucherDiscount(
                voucher,
                cart,
                runningSubtotal,
                runningShippingCost
            );

            if (discount.amount > 0) {
                appliedVouchers.push({
                    voucher_id: voucher.id,
                    code: voucher.code,
                    type: voucher.type,
                    discount_amount: discount.amount,
                    priority: voucher.stack_priority || 0
                });

                switch (voucher.type) {
                    case 'SHIPPING':
                        totalShippingDiscount += discount.amount;
                        runningShippingCost = Math.max(0, runningShippingCost - discount.amount);
                        break;

                    case 'DISCOUNT':
                    case 'PAYMENT_DISCOUNT':
                        totalItemsDiscount += discount.amount;
                        runningSubtotal = Math.max(0, runningSubtotal - discount.amount);
                        break;

                    case 'CASHBACK':
                        totalCashback += discount.amount;
                        break;
                }
            }
        }

        const finalTotal = runningSubtotal + runningShippingCost;

        return {
            appliedVouchers,
            totalDiscount: totalItemsDiscount + totalShippingDiscount,
            shippingDiscount: totalShippingDiscount,
            itemsDiscount: totalItemsDiscount,
            cashbackAmount: totalCashback,
            finalTotal,
            breakdown: {
                subtotal: cart.subtotal,
                itemsDiscount: totalItemsDiscount,
                shipping_cost: cart.shippingCost,
                shippingDiscount: totalShippingDiscount,
                total: finalTotal
            },
            errors: errors.length > 0 ? errors : undefined
        };
    }

    async fetchVouchers(codes) {
        const now = new Date();
        return await prisma.vouchers.findMany({
            where: {
                code: { in: codes },
                is_active: true,
                valid_from: { lte: now },
                valid_until: { gte: now }
            }
        });
    }

    async validateVoucher(voucher, cart) {
        // Check usage limit
        if (voucher.max_usage_total && voucher.usage_count >= voucher.max_usage_total) {
            return { isValid: false, reason: 'Voucher usage limit reached' };
        }

        // Check user usage
        const userUsageCount = await prisma.voucher_usages.count({
            where: {
                voucher_id: voucher.id,
                user_id: cart.userId
            }
        });

        if (userUsageCount >= (voucher.max_usage_per_user || 1)) {
            return { isValid: false, reason: 'You have reached usage limit' };
        }

        // Check minimum purchase
        if (voucher.min_purchase && cart.subtotal < Number(voucher.min_purchase)) {
            return {
                isValid: false,
                reason: `Minimum purchase Rp ${Number(voucher.min_purchase).toLocaleString()} required`
            };
        }

        return { isValid: true };
    }

    validateStacking(vouchers) {
        const maxVouchersAllowed = 3;

        if (vouchers.length > maxVouchersAllowed) {
            return {
                isValid: false,
                reason: `Maximum ${maxVouchersAllowed} vouchers can be used together`
            };
        }

        // Check exclusivity
        for (const voucher of vouchers) {
            if (voucher.exclusive_with && voucher.exclusive_with.length > 0) {
                const hasConflict = vouchers.some(v =>
                    v.id !== voucher.id && voucher.exclusive_with.includes(v.type)
                );

                if (hasConflict) {
                    return {
                        isValid: false,
                        reason: `${voucher.code} cannot be used with other selected vouchers`
                    };
                }
            }
        }

        // Prevent multiple same type (except DISCOUNT)
        const typeCount = {};
        for (const voucher of vouchers) {
            typeCount[voucher.type] = (typeCount[voucher.type] || 0) + 1;

            if (typeCount[voucher.type] > 1 && voucher.type !== 'DISCOUNT') {
                return {
                    isValid: false,
                    reason: `Cannot use multiple ${voucher.type} vouchers`
                };
            }
        }

        return { isValid: true };
    }

    calculateVoucherDiscount(voucher, cart, currentSubtotal, currentShippingCost) {
        let discountAmount = 0;

        switch (voucher.type) {
            case 'SHIPPING':
                if (voucher.discount_type === 'percentage') {
                    discountAmount = currentShippingCost * (Number(voucher.discount_value) / 100);
                } else {
                    discountAmount = Number(voucher.discount_value);
                }
                discountAmount = Math.min(discountAmount, currentShippingCost);
                break;

            case 'DISCOUNT':
            case 'PAYMENT_DISCOUNT':
                let applicableSubtotal = currentSubtotal;

                if (voucher.discount_type === 'percentage') {
                    discountAmount = applicableSubtotal * (Number(voucher.discount_value) / 100);

                    if (voucher.max_discount) {
                        discountAmount = Math.min(discountAmount, Number(voucher.max_discount));
                    }
                } else {
                    discountAmount = Number(voucher.discount_value);
                }

                discountAmount = Math.min(discountAmount, applicableSubtotal);
                break;

            case 'CASHBACK':
                const estimatedFinal = currentSubtotal + currentShippingCost;

                if (voucher.discount_type === 'percentage') {
                    discountAmount = estimatedFinal * (Number(voucher.discount_value) / 100);

                    if (voucher.max_discount) {
                        discountAmount = Math.min(discountAmount, Number(voucher.max_discount));
                    }
                } else {
                    discountAmount = Number(voucher.discount_value);
                }
                break;
        }

        return { amount: Math.max(0, discountAmount) };
    }

    async recordVoucherUsage(orderId, userId, appliedVouchers) {
        await prisma.$transaction(async (tx) => {
            for (const applied of appliedVouchers) {
                await tx.voucher_usages.create({
                    data: {
                        voucher_id: applied.voucherId,
                        user_id: userId,
                        order_id: orderId,
                        discount_amount: applied.discountAmount
                    }
                });

                await tx.vouchers.update({
                    where: { id: applied.voucherId },
                    data: { usage_count: { increment: 1 } }
                });
            }
        });
    }
}

export const voucherEngine = new VoucherStackingEngine();
