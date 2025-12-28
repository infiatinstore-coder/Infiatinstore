/**
 * TRACKING CRON JOBS
 * 
 * Background tasks for shipment tracking:
 * 1. Sync active shipments (every 4 hours)
 * 2. Alert stuck shipments (daily at 10 AM)
 * 3. Process pending webhooks (every 15 minutes)
 */

const { trackingService } = require('../tracking-service');
const { prisma } = require('../prisma');

/**
 * Sync all active shipments with courier APIs
 * Run every 4 hours (fallback for couriers without webhook)
 * 
 * @returns {Promise<void>}
 */
async function syncAllActiveShipmentsJob() {
    try {
        console.log('🔄 Starting shipment sync...');

        const count = await trackingService.syncAllActiveShipments(100);

        console.log(`✅ Synced ${count} active shipments`);

    } catch (error) {
        console.error('❌ Shipment sync job failed:', error);
    }
}

/**
 * Alert for stuck shipments (in transit > 7 days)
 * Run daily at 10 AM
 * 
 * @returns {Promise<void>}
 */
async function alertStuckShipmentsJob() {
    try {
        console.log('🔄 Checking for stuck shipments...');

        const stuckShipments = await trackingService.getStuckShipments();

        if (stuckShipments.length > 0) {
            console.warn(`⚠️ Found ${stuckShipments.length} stuck shipments!`);

            await sendStuckShipmentsAlert(stuckShipments);
        } else {
            console.log('✅ No stuck shipments found');
        }

    } catch (error) {
        console.error('❌ Stuck shipments alert job failed:', error);
    }
}

/**
 * Process pending courier webhooks that failed
 * Run every 15 minutes
 * 
 * @returns {Promise<void>}
 */
async function processPendingWebhooksJob() {
    try {
        console.log('🔄 Processing pending webhooks...');

        // Find unprocessed webhooks older than 5 minutes
        const pendingWebhooks = await prisma.courierWebhook.findMany({
            where: {
                processed: false,
                createdAt: {
                    lte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
                }
            },
            take: 50
        });

        if (pendingWebhooks.length === 0) {
            console.log('✅ No pending webhooks');
            return;
        }

        console.log(`📦 Processing ${pendingWebhooks.length} pending webhooks...`);

        for (const webhook of pendingWebhooks) {
            try {
                // Find shipment
                const shipment = await prisma.shipment.findUnique({
                    where: { trackingNumber: webhook.trackingNumber }
                });

                if (!shipment) {
                    // Mark as processed even if shipment not found
                    await prisma.courierWebhook.update({
                        where: { id: webhook.id },
                        data: {
                            processed: true,
                            processedAt: new Date()
                        }
                    });
                    continue;
                }

                // Update shipment
                await trackingService.updateShipmentStatus(shipment.id);

                // Mark webhook as processed
                await prisma.courierWebhook.update({
                    where: { id: webhook.id },
                    data: {
                        processed: true,
                        processedAt: new Date()
                    }
                });

            } catch (error) {
                console.error(`Failed to process webhook ${webhook.id}:`, error.message);
            }
        }

        console.log('✅ Pending webhooks processed');

    } catch (error) {
        console.error('❌ Process pending webhooks job failed:', error);
    }
}

/**
 * Send stuck shipments alert to admin
 */
async function sendStuckShipmentsAlert(shipments) {
    // TODO: Implement email/notification to admin
    console.log('📧 Sending stuck shipments alert to admin...');

    const message = `
Stuck Shipments Alert
=====================

${shipments.length} shipments have been in transit for more than 7 days:

${shipments.map(s => {
        const daysSinceUpdate = Math.floor(
            (Date.now() - s.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
        );

        return `
- Order: ${s.order.orderNumber}
  Tracking: ${s.trackingNumber}
  Courier: ${s.courierCode}
  Current Location: ${s.currentLocation || 'Unknown'}
  Days Since Update: ${daysSinceUpdate}
`;
    }).join('\n')}

Please investigate these shipments.
`;

    console.log(message);
}

module.exports = {
    syncAllActiveShipmentsJob,
    alertStuckShipmentsJob,
    processPendingWebhooksJob
};
