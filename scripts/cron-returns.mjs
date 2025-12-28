/**
 * RETURN & REFUND CRON JOBS
 * Automated tasks for return management
 */

import prisma from '../lib/prisma.js';
import { returnManager } from '../lib/returnManager.js';
import { emailService } from '../lib/emailService.js';

/**
 * Auto-reject returns that exceeded seller response deadline
 */
export async function autoRejectExpiredReturns() {
    const expiredReturns = await prisma.return_requests.findMany({
        where: {
            status: 'PENDING',
            seller_response_deadline: { lte: new Date() }
        }
    });

    console.log(`Auto-rejecting ${expiredReturns.length} expired returns...`);

    for (const returnRequest of expiredReturns) {
        await prisma.return_requests.update({
            where: { id: returnRequest.id },
            data: {
                status: 'APPROVED', // Auto-approve if seller doesn't respond
                seller_response: 'Auto-approved (no seller response)',
                seller_response_at: new Date(),
                shipback_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            }
        });

        // Notify buyer
        await emailService.queueEmail(
            returnRequest.user_email,
            'return_auto_approved',
            { returnId: returnRequest.id },
            9
        );
    }

    return expiredReturns.length;
}

/**
 * Auto-cancel returns where buyer didn't ship back within deadline
 */
export async function autoCancelUnshippedReturns() {
    const unshipped = await prisma.return_requests.findMany({
        where: {
            status: 'APPROVED',
            shipback_deadline: { lte: new Date() },
            return_tracking: null
        }
    });

    console.log(`Auto-canceling ${unshipped.length} unshipped returns...`);

    for (const returnRequest of unshipped) {
        await prisma.return_requests.update({
            where: { id: returnRequest.id },
            data: {
                status: 'CANCELLED'
            }
        });

        // Notify buyer
        await emailService.queueEmail(
            returnRequest.user_email,
            'return_cancelled_timeout',
            { returnId: returnRequest.id },
            7
        );
    }

    return unshipped.length;
}

/**
 * Sync return shipment tracking
 */
export async function syncReturnTracking() {
    const activeReturns = await prisma.return_requests.findMany({
        where: {
            status: 'SHIPPING_BACK',
            return_tracking: { not: null }
        }
    });

    console.log(`Syncing tracking for ${activeReturns.length} returns...`);

    // TODO: Integrate with tracking API
    // For now, just log

    return activeReturns.length;
}

/**
 * Send reminders for pending actions
 */
export async function sendReturnReminders() {
    // Remind sellers to respond
    const pendingSeller = await prisma.return_requests.findMany({
        where: {
            status: 'PENDING',
            seller_response_deadline: {
                gte: new Date(),
                lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h before deadline
            }
        }
    });

    for (const returnRequest of pendingSeller) {
        await emailService.queueEmail(
            returnRequest.seller_email,
            'return_reminder_seller',
            { returnId: returnRequest.id },
            7
        );
    }

    // Remind buyers to ship back
    const pendingBuyer = await prisma.return_requests.findMany({
        where: {
            status: 'APPROVED',
            return_tracking: null,
            shipback_deadline: {
                gte: new Date(),
                lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        }
    });

    for (const returnRequest of pendingBuyer) {
        await emailService.queueEmail(
            returnRequest.user_email,
            'return_reminder_buyer',
            { returnId: returnRequest.id },
            7
        );
    }

    return pendingSeller.length + pendingBuyer.length;
}

/**
 * Run all return jobs
 */
export async function runReturnJobs() {
    console.log('🔄 Running return management jobs...');

    const results = await Promise.all([
        autoRejectExpiredReturns(),
        autoCancelUnshippedReturns(),
        syncReturnTracking(),
        sendReturnReminders()
    ]);

    console.log('✅ Return jobs completed:', {
        autoRejected: results[0],
        autoCancelled: results[1],
        trackingSynced: results[2],
        remindersSent: results[3]
    });

    return results;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runReturnJobs()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
