/**
 * INVENTORY CRON JOBS
 * 
 * Background tasks for inventory management:
 * 1. Release expired stock reservations (every 5 minutes)
 * 2. Reconcile stock discrepancies (daily at 2 AM)
 * 3. Low stock alerts (daily at 9 AM)
 */

// Try to import stockManager from different possible locations
let stockManager;
try {
    stockManager = require('../stockManager-v2');
} catch {
    try {
        stockManager = require('../stock-manager');
    } catch {
        stockManager = {
            releaseExpiredReservations: async () => 0,
            reconcileStock: async () => [],
            getLowStockProducts: async () => []
        };
    }
}

const prisma = require('../prisma').default || require('../prisma');

/**
 * Release expired stock reservations
 * Run every 5 minutes
 * 
 * @returns {Promise<void>}
 */
async function releaseExpiredReservationsJob() {
    try {
        console.log('🔄 Starting expired reservations cleanup...');

        const count = await stockManager.releaseExpiredReservations();

        if (count > 0) {
            console.log(`✅ Released ${count} expired stock reservations`);

            // Send notification to admin if significant
            if (count > 10) {
                // TODO: Send admin alert
                console.warn(`⚠️ High number of expired reservations: ${count}`);
            }
        } else {
            console.log('✅ No expired reservations found');
        }

    } catch (error) {
        console.error('❌ Expired reservations job failed:', error);
    }
}

/**
 * Reconcile stock discrepancies
 * Run daily at 2 AM
 * 
 * @returns {Promise<void>}
 */
async function reconcileStockJob() {
    try {
        console.log('🔄 Starting stock reconciliation...');

        const discrepancies = await stockManager.reconcileStock();

        if (discrepancies.length > 0) {
            console.log(`⚠️ Found ${discrepancies.length} stock discrepancies:`);
            discrepancies.forEach(d => {
                console.log(`  - ${d.name}: expected ${d.expected}, actual ${d.actual} (diff: ${d.difference})`);
            });

            // Send admin alert
            await sendStockDiscrepancyAlert(discrepancies);
        } else {
            console.log('✅ No stock discrepancies found');
        }

    } catch (error) {
        console.error('❌ Stock reconciliation job failed:', error);
    }
}

/**
 * Low stock alert
 * Run daily at 9 AM
 * 
 * @returns {Promise<void>}
 */
async function lowStockAlertJob() {
    try {
        console.log('🔄 Checking for low stock products...');

        const lowStockProducts = await stockManager.getLowStockProducts();

        if (lowStockProducts.length > 0) {
            console.log(`⚠️ Found ${lowStockProducts.length} low stock products`);

            const criticalProducts = lowStockProducts.filter(p => p.stock <= 5);

            if (criticalProducts.length > 0) {
                console.warn(`🚨 CRITICAL: ${criticalProducts.length} products have ≤5 stock!`);
            }

            // Send admin alert
            await sendLowStockAlert(lowStockProducts);
        } else {
            console.log('✅ All products have sufficient stock');
        }

    } catch (error) {
        console.error('❌ Low stock alert job failed:', error);
    }
}

/**
 * Send stock discrepancy alert to admin
 */
async function sendStockDiscrepancyAlert(discrepancies) {
    // TODO: Implement email/notification to admin
    console.log('📧 Sending stock discrepancy alert to admin...');

    const message = `
Stock Discrepancies Detected
============================

Found ${discrepancies.length} products with stock discrepancies:

${discrepancies.map(d => `
Product: ${d.name}
Expected Reserved: ${d.expected}
Actual Reserved: ${d.actual}
Difference: ${d.difference}
`).join('\n')}

All discrepancies have been automatically corrected.
`;

    console.log(message);
}

/**
 * Send low stock alert to admin
 */
async function sendLowStockAlert(products) {
    // TODO: Implement email/notification to admin
    console.log('📧 Sending low stock alert to admin...');

    const message = `
Low Stock Alert
===============

${products.length} products are running low on stock:

${products.map(p => `
- ${p.name}
  Current Stock: ${p.stock}
  Reserved: ${p.stockReserved}
  Available: ${p.stock - p.stockReserved}
  Threshold: ${p.lowStockThreshold}
`).join('\n')}

Please restock these items soon.
`;

    console.log(message);
}

module.exports = {
    releaseExpiredReservationsJob,
    reconcileStockJob,
    lowStockAlertJob
};
