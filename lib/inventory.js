import prisma from './prisma';

/**
 * INDUSTRY-GRADE INVENTORY MANAGEMENT
 * 
 * Handles:
 * - Race condition prevention (database locks)
 * - Atomic stock updates
 * - Comprehensive audit trail
 * - Rollback support
 */

/**
 * Reduce stock with transaction safety (for orders)
 * Uses database row-level locking to prevent race conditions
 */
export async function reduceStock(items, orderId, userId = null) {
    return await prisma.$transaction(async (tx) => {
        const logs = [];

        for (const item of items) {
            const { productId, variantId, quantity } = item;

            if (variantId) {
                // Lock variant row FOR UPDATE
                const variant = await tx.$queryRaw`
                    SELECT * FROM product_variants 
                    WHERE id = ${variantId}::uuid 
                    FOR UPDATE
                `;

                if (!variant || variant.length === 0) {
                    throw new Error(`Variant ${variantId} tidak ditemukan`);
                }

                const currentStock = variant[0].stock;

                if (currentStock < quantity) {
                    throw new Error(`Stok variant tidak mencukupi. Tersedia: ${currentStock}, Diminta: ${quantity}`);
                }

                // Update stock
                await tx.productVariant.update({
                    where: { id: variantId },
                    data: { stock: { decrement: quantity } }
                });

                // Log inventory change
                const log = await tx.inventoryLog.create({
                    data: {
                        productId,
                        variantId,
                        type: 'SALE',
                        quantity: -quantity,
                        quantityBefore: currentStock,
                        quantityAfter: currentStock - quantity,
                        orderId,
                        userId,
                        notes: `Order ${orderId}: Sold ${quantity} units`
                    }
                });

                logs.push(log);
            } else {
                // Lock product row FOR UPDATE
                const product = await tx.$queryRaw`
                    SELECT * FROM products 
                    WHERE id = ${productId}::uuid 
                    FOR UPDATE
                `;

                if (!product || product.length === 0) {
                    throw new Error(`Product ${productId} tidak ditemukan`);
                }

                const currentStock = product[0].stock;

                if (currentStock < quantity) {
                    const productName = product[0].name;
                    throw new Error(`Stok "${productName}" tidak mencukupi. Tersedia: ${currentStock}, Diminta: ${quantity}`);
                }

                // Update stock
                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: quantity } }
                });

                // Log inventory change
                const log = await tx.inventoryLog.create({
                    data: {
                        productId,
                        type: 'SALE',
                        quantity: -quantity,
                        quantityBefore: currentStock,
                        quantityAfter: currentStock - quantity,
                        orderId,
                        userId,
                        notes: `Order ${orderId}: Sold ${quantity} units`
                    }
                });

                logs.push(log);
            }
        }

        return logs;
    });
}

/**
 * Restore stock (for cancelled orders or returns)
 */
export async function restoreStock(items, orderId, reason = 'ORDER_CANCELLED', userId = null) {
    return await prisma.$transaction(async (tx) => {
        const logs = [];

        for (const item of items) {
            const { productId, variantId, quantity } = item;

            if (variantId) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: variantId }
                });

                if (!variant) continue;

                const currentStock = variant.stock;

                await tx.productVariant.update({
                    where: { id: variantId },
                    data: { stock: { increment: quantity } }
                });

                const log = await tx.inventoryLog.create({
                    data: {
                        productId,
                        variantId,
                        type: reason === 'RETURN' ? 'RETURN' : 'SALE_CANCELLED',
                        quantity: quantity, // positive
                        quantityBefore: currentStock,
                        quantityAfter: currentStock + quantity,
                        orderId,
                        userId,
                        notes: `Stock restored: ${reason}`
                    }
                });

                logs.push(log);
            } else {
                const product = await tx.product.findUnique({
                    where: { id: productId }
                });

                if (!product) continue;

                const currentStock = product.stock;

                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { increment: quantity } }
                });

                const log = await tx.inventoryLog.create({
                    data: {
                        productId,
                        type: reason === 'RETURN' ? 'RETURN' : 'SALE_CANCELLED',
                        quantity: quantity,
                        quantityBefore: currentStock,
                        quantityAfter: currentStock + quantity,
                        orderId,
                        userId,
                        notes: `Stock restored: ${reason}`
                    }
                });

                logs.push(log);
            }
        }

        return logs;
    });
}

/**
 * Manual stock adjustment by admin
 */
export async function adjustStock(productId, variantId, newStock, userId, notes = '') {
    return await prisma.$transaction(async (tx) => {
        if (variantId) {
            const variant = await tx.productVariant.findUnique({
                where: { id: variantId }
            });

            if (!variant) {
                throw new Error('Variant tidak ditemukan');
            }

            const currentStock = variant.stock;
            const difference = newStock - currentStock;

            await tx.productVariant.update({
                where: { id: variantId },
                data: { stock: newStock }
            });

            return await tx.inventoryLog.create({
                data: {
                    productId,
                    variantId,
                    type: 'ADJUSTMENT',
                    quantity: difference,
                    quantityBefore: currentStock,
                    quantityAfter: newStock,
                    userId,
                    notes: notes || `Manual adjustment by admin`
                }
            });
        } else {
            const product = await tx.product.findUnique({
                where: { id: productId }
            });

            if (!product) {
                throw new Error('Product tidak ditemukan');
            }

            const currentStock = product.stock;
            const difference = newStock - currentStock;

            await tx.product.update({
                where: { id: productId },
                data: { stock: newStock }
            });

            return await tx.inventoryLog.create({
                data: {
                    productId,
                    type: 'ADJUSTMENT',
                    quantity: difference,
                    quantityBefore: currentStock,
                    quantityAfter: newStock,
                    userId,
                    notes: notes || `Manual adjustment by admin`
                }
            });
        }
    });
}

/**
 * Reserve flash sale stock with row-level lock
 * CRITICAL: Prevents race condition when 500 users compete for 10 items
 * 
 * Uses SELECT FOR UPDATE to ensure atomic quota check + update
 */
export async function reserveFlashSaleStock(flashSaleProductId, quantity, userId) {
    return await prisma.$transaction(async (tx) => {
        // LOCK the flash sale product row - other requests WAIT here
        const fsProduct = await tx.$queryRaw`
            SELECT * FROM flash_sale_products 
            WHERE id = ${flashSaleProductId}::uuid 
            FOR UPDATE
        `;

        if (!fsProduct || fsProduct.length === 0) {
            throw new Error('Flash sale product tidak ditemukan');
        }

        const stockLimit = fsProduct[0].stock_limit;
        const soldCount = fsProduct[0].sold_count;
        const available = stockLimit - soldCount;

        if (available < quantity) {
            throw new Error(
                `🔥 Flash Sale habis! Tersedia: ${available}, Diminta: ${quantity}`
            );
        }

        // Check per-user purchase limit (max 2 per user)
        const existingPurchase = await tx.flashSalePurchase.findUnique({
            where: {
                flashSaleProductId_userId: {
                    flashSaleProductId,
                    userId
                }
            }
        });

        if (existingPurchase) {
            if (existingPurchase.quantity + quantity > 2) {
                throw new Error(
                    `Batas pembelian Flash Sale: max 2 item per user. ` +
                    `Anda sudah membeli ${existingPurchase.quantity} item.`
                );
            }
        }

        // ATOMIC UPDATE - increment sold count
        await tx.flashSaleProduct.update({
            where: { id: flashSaleProductId },
            data: { sold_count: { increment: quantity } }
        });

        // Track per-user purchase
        if (existingPurchase) {
            await tx.flashSalePurchase.update({
                where: {
                    flashSaleProductId_userId: {
                        flashSaleProductId,
                        userId
                    }
                },
                data: { quantity: { increment: quantity } }
            });
        } else {
            await tx.flashSalePurchase.create({
                data: {
                    flashSaleProductId,
                    userId,
                    quantity
                }
            });
        }

        return {
            success: true,
            flashSaleProductId,
            reserved: quantity,
            remaining: available - quantity,
            sold_count: soldCount + quantity,
            stockLimit
        };
    });
}

/**
 * Get inventory history for a product
 */
export async function getInventoryHistory(productId, options = {}) {
    const { limit = 50, variantId = null } = options;

    return await prisma.inventoryLog.findMany({
        where: {
            productId,
            ...(variantId && { variantId })
        },
        orderBy: {
            created_at: 'desc'
        },
        take: limit
    });
}
