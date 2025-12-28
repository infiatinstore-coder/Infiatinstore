import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import prisma from '@/lib/prisma';
import { reserveFlashSaleStock } from '@/lib/inventory';

/**
 * FLASH SALE RACE CONDITION TESTS
 * 
 * Critical: Tests the atomic reservation system
 */

describe('Flash Sale Race Condition Protection', () => {
    let testFlashSale;
    let testProduct;
    let testUser1;
    let testUser2;

    beforeEach(async () => {
        // Create test product
        testProduct = await prisma.product.create({
            data: {
                name: 'Test Product',
                slug: 'test-product-' + Date.now(),
                description: 'Test',
                categoryId: 'test-category-id', // Assumes category exists
                basePrice: 100000,
                stock: 100,
                weight: 100,
                images: ['https://via.placeholder.com/400'],
                status: 'ACTIVE'
            }
        });

        // Create flash sale
        testFlashSale = await prisma.flashSale.create({
            data: {
                name: 'Test Flash Sale',
                slug: 'test-flash-' + Date.now(),
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                status: 'ACTIVE',
                products: {
                    create: {
                        productId: testProduct.id,
                        salePrice: 50000,
                        stockLimit: 10,
                        soldCount: 0
                    }
                }
            },
            include: { products: true }
        });

        // Create test users
        testUser1 = await prisma.user.create({
            data: {
                email: 'testuser1@test.com',
                passwordHash: 'hash',
                name: 'Test User 1',
                role: 'CUSTOMER',
                status: 'ACTIVE'
            }
        });

        testUser2 = await prisma.user.create({
            data: {
                email: 'testuser2@test.com',
                passwordHash: 'hash',
                name: 'Test User 2',
                role: 'CUSTOMER',
                status: 'ACTIVE'
            }
        });
    });

    afterEach(async () => {
        // Cleanup
        await prisma.flashSalePurchase.deleteMany({});
        await prisma.flashSaleProduct.deleteMany({});
        await prisma.flashSale.deleteMany({});
        await prisma.product.delete({ where: { id: testProduct.id } });
        await prisma.user.delete({ where: { id: testUser1.id } });
        await prisma.user.delete({ where: { id: testUser2.id } });
    });

    it('should reserve flash sale stock successfully', async () => {
        const flashSaleProduct = testFlashSale.products[0];

        const result = await reserveFlashSaleStock(
            flashSaleProduct.id,
            2,
            testUser1.id
        );

        expect(result.success).toBe(true);
        expect(result.reserved).toBe(2);
        expect(result.remaining).toBe(8);
        expect(result.soldCount).toBe(2);

        // Verify database
        const updated = await prisma.flashSaleProduct.findUnique({
            where: { id: flashSaleProduct.id }
        });
        expect(updated.soldCount).toBe(2);
    });

    it('should reject when stock limit exceeded', async () => {
        const flashSaleProduct = testFlashSale.products[0];

        // Update sold count to 9
        await prisma.flashSaleProduct.update({
            where: { id: flashSaleProduct.id },
            data: { soldCount: 9 }
        });

        // Try to buy 2 (should fail)
        await expect(
            reserveFlashSaleStock(flashSaleProduct.id, 2, testUser1.id)
        ).rejects.toThrow('Flash Sale habis');
    });

    it('should enforce per-user purchase limit', async () => {
        const flashSaleProduct = testFlashSale.products[0];

        // First purchase: 2 items
        await reserveFlashSaleStock(flashSaleProduct.id, 2, testUser1.id);

        // Second purchase: 1 item (should fail - total would be 3)
        await expect(
            reserveFlashSaleStock(flashSaleProduct.id, 1, testUser1.id)
        ).rejects.toThrow('Batas pembelian');
    });

    it('should allow different users to purchase', async () => {
        const flashSaleProduct = testFlashSale.products[0];

        // User 1 buys 2
        await reserveFlashSaleStock(flashSaleProduct.id, 2, testUser1.id);

        // User 2 buys 2 (should succeed)
        const result = await reserveFlashSaleStock(
            flashSaleProduct.id,
            2,
            testUser2.id
        );

        expect(result.success).toBe(true);
        expect(result.soldCount).toBe(4);

        // Verify both users tracked
        const purchases = await prisma.flashSalePurchase.findMany({
            where: { flashSaleProductId: flashSaleProduct.id }
        });
        expect(purchases).toHaveLength(2);
    });

    it('should handle concurrent requests (race condition test)', async () => {
        const flashSaleProduct = testFlashSale.products[0];

        // Simulate 20 concurrent requests for 1 item each
        // Only 10 should succeed (stock limit = 10)
        const promises = Array.from({ length: 20 }, (_, i) => {
            const userId = i % 2 === 0 ? testUser1.id : testUser2.id;
            return reserveFlashSaleStock(flashSaleProduct.id, 1, userId)
                .then(res => ({ success: true, data: res }))
                .catch(err => ({ success: false, error: err.message }));
        });

        const results = await Promise.all(promises);

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        // At most 10 successful (5 per user due to per-user limit of 2)
        expect(successful.length).toBeLessThanOrEqual(10);
        expect(failed.length).toBeGreaterThan(0);

        // Verify database state
        const updated = await prisma.flashSaleProduct.findUnique({
            where: { id: flashSaleProduct.id }
        });
        expect(updated.soldCount).toBeLessThanOrEqual(10);
    });
});
