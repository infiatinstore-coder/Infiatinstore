/**
 * BACKFILL ANALYTICS DATA
 * Populate historical metrics for last 90 days
 */

import { analyticsService } from '../lib/analyticsService.js';

async function backfillAnalytics() {
    const days = 90; // Last 90 days

    console.log(`🔄 Starting backfill for ${days} days...`);

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        console.log(`Processing ${date.toDateString()}...`);

        try {
            // Calculate metrics for this date
            await analyticsService.calculateDailyMetrics(date);
            await analyticsService.calculateSellerMetrics(date);

            console.log(`   ✅ Day ${i + 1}/${days} complete`);
        } catch (error) {
            console.error(`   ❌ Error on ${date.toDateString()}:`, error.message);
        }
    }

    console.log('\n✅ Backfill complete!');
    console.log('📊 Updating customer metrics...');

    // Update all customer lifetime metrics
    const { default: prisma } = await import('../lib/prisma.js');

    const users = await prisma.users.findMany({
        where: {
            orders: { some: {} }
        },
        select: { id: true }
    });

    for (const user of users) {
        await analyticsService.updateCustomerMetrics(user.id);
    }

    console.log(`✅ Updated ${users.length} customer metrics`);
}

// Run backfill
backfillAnalytics()
    .then(() => {
        console.log('\n🎉 All historical data processed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Backfill failed:', error);
        process.exit(1);
    });
