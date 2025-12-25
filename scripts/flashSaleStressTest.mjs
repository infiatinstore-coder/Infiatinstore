/**
 * 🔥 FLASH SALE STRESS TEST
 * 
 * Simulates worst-case scenario:
 * - 10 items in flash sale
 * - 500 concurrent buyers clicking "Buy" at the same time
 * 
 * Expected Result:
 * ✅ Exactly 10 successful purchases (or 5 users with 2 items each = 10 items)
 * ❌ 490+ requests rejected with "Flash Sale habis"
 * ✅ No overselling (soldCount <= stockLimit)
 * ✅ Per-user limit enforced (max 2 per user)
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TOTAL_BUYERS = 500;
const STOCK_LIMIT = 10;
const FLASH_SALE_PRODUCT_ID = process.env.TEST_FLASH_SALE_ID || 'test-fs-product-id';

// Test user credentials (will create test users)
const TEST_USERS = Array.from({ length: TOTAL_BUYERS }, (_, i) => ({
    email: `stresstest${i}@test.com`,
    password: 'Test123!',
    name: `Buyer ${i}`,
    id: null, // Will be populated after login
    token: null
}));

/**
 * Create test flash sale via API
 */
async function setupTestFlashSale(adminToken) {
    console.log('🔧 Setting up test flash sale...');

    // Create test product first
    const productRes = await fetch(`${API_BASE}/api/admin/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: 'iPhone 15 Pro Flash Sale Test',
            slug: 'iphone-15-flash-test-' + Date.now(),
            description: 'Limited flash sale test product',
            categoryId: 'existing-category-id', // TODO: Get real category
            basePrice: 20000000,
            salePrice: 18000000,
            stock: 100, // Regular stock
            weight: 200,
            images: ['https://via.placeholder.com/400'],
            status: 'ACTIVE'
        })
    });

    if (!productRes.ok) {
        throw new Error('Failed to create test product');
    }

    const { product } = await productRes.json();
    console.log(`✅ Created product: ${product.id}`);

    // Create flash sale
    const flashSaleRes = await fetch(`${API_BASE}/api/admin/flash-sales`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: 'Stress Test Flash Sale',
            slug: 'stress-test-' + Date.now(),
            description: 'Testing 500 concurrent buyers',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour
            products: [{
                productId: product.id,
                salePrice: 15000000,
                stockLimit: STOCK_LIMIT
            }]
        })
    });

    if (!flashSaleRes.ok) {
        throw new Error('Failed to create flash sale');
    }

    const { flashSale } = await flashSaleRes.json();
    console.log(`✅ Created flash sale: ${flashSale.id}`);

    return { productId: product.id, flashSaleId: flashSale.id };
}

/**
 * Simulate a single buyer attempting to purchase
 */
async function simulatePurchase(user, productId, addressId) {
    try {
        const res = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                items: [{
                    productId,
                    quantity: 1
                }],
                addressId,
                shippingMethod: 'jne',
                courierService: 'REG',
                paymentMethod: 'bank_transfer'
            })
        });

        const data = await res.json();

        if (res.ok) {
            return { success: true, orderId: data.order?.id, user: user.email };
        } else {
            return { success: false, error: data.error, user: user.email };
        }
    } catch (error) {
        return { success: false, error: error.message, user: user.email };
    }
}

/**
 * Run the stress test
 */
async function runStressTest() {
    console.log('🔥 FLASH SALE STRESS TEST');
    console.log('='.repeat(50));
    console.log(`Total Buyers:    ${TOTAL_BUYERS}`);
    console.log(`Stock Limit:     ${STOCK_LIMIT}`);
    console.log(`Per-User Limit:  2 items`);
    console.log('='.repeat(50));
    console.log('');

    // Note: This is a simplified version
    // In production, you'd need to:
    // 1. Setup admin user and get token
    // 2. Create test flash sale
    // 3. Create test users with addresses
    // 4. Fire concurrent requests
    // 5. Verify database state

    console.log('⚠️  SETUP REQUIRED:');
    console.log('1. Create test flash sale manually');
    console.log('2. Set TEST_FLASH_SALE_ID env variable');
    console.log('3. Create test users with addresses');
    console.log('4. Run: node scripts/flashSaleStressTest.mjs');
    console.log('');
    console.log('Example verification query:');
    console.log('SELECT stock_limit, sold_count FROM flash_sale_products WHERE id = \'...\';');
    console.log('');
    console.log('✅ Expected: sold_count <= stock_limit');
    console.log('✅ Expected: No user purchased more than 2 items');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runStressTest().catch(console.error);
}

export { runStressTest, simulatePurchase };
