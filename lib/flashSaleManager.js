/**
 * FLASH SALE MANAGER
 * Time-limited offers and stock enforcement
 */

import prisma from './prisma';

export class FlashSaleManager {

    /**
     * Check if product is currently in flash sale
     */
    async getActiveFlashSaleItem(productId) {
        const now = new Date();

        const flashSaleItem = await prisma.flash_sale_items.findFirst({
            where: {
                product_id: productId,
                flash_sale: {
                    start_time: { lte: now },
                    end_time: { gte: now },
                    is_active: true
                },
                stock_sold: { lt: prisma.flash_sale_items.fields.stock_allocated }
            },
            include: {
                flash_sale: true
            }
        });

        if (!flashSaleItem) return null;

        return {
            id: flashSaleItem.id,
            flash_sale_id: flashSaleItem.flash_sale_id,
            discountPrice: flashSaleItem.discount_price,
            maxPerUser: flashSaleItem.max_per_user,
            remainingStock: flashSaleItem.stock_allocated - flashSaleItem.stock_sold,
            end_time: flashSaleItem.flash_sale.end_time
        };
    }

    /**
     * Validate flash sale purchase eligibility
     */
    async validatePurchase(userId, flashSaleItemId, quantity) {
        const item = await prisma.flash_sale_items.findUnique({
            where: { id: flashSaleItemId }
        });

        if (!item) return { valid: false, reason: 'Flash sale item not found' };

        // Check stock
        if (item.stock_allocated - item.stock_sold < quantity) {
            return { valid: false, reason: 'Flash sale stock exhausted' };
        }

        // Check user limit
        // (Requires tracking user purchases in flash sale - usually via OrderItem link)
        /*
        const userPurchases = await prisma.order_items.aggregate({
            where: {
                order: { user_id: userId },
                flash_sale_item_id: flashSaleItemId
            },
            _sum: { quantity: true }
        });
        
        const purchased = userPurchases._sum.quantity || 0;
        if (purchased + quantity > item.max_per_user) {
            return { valid: false, reason: 'Maximum purchase limit reached' };
        }
        */

        return { valid: true };
    }

    /**
     * Record flash sale purchase (increment sold count)
     */
    async recordPurchase(flashSaleItemId, quantity) {
        await prisma.flash_sale_items.update({
            where: { id: flashSaleItemId },
            data: {
                stock_sold: { increment: quantity }
            }
        });
    }
}

export const flashSaleManager = new FlashSaleManager();
