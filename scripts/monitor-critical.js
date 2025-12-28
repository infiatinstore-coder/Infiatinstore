/**
 * MONITORING CRON JOB
 * Runs every 5 minutes to check for critical issues
 * Project: infiatin.store
 */

import { PrismaClient } from '@prisma/client';
import { runCriticalMonitoring } from '../lib/alerts.js';

const prisma = new PrismaClient();

async function main() {
    console.log(`[${new Date().toISOString()}] Starting critical monitoring check...`);

    try {
        const result = await runCriticalMonitoring(prisma);

        if (result.success) {
            console.log(`✅ Monitoring completed successfully. Alerts sent: ${result.alertsSent}`);
        } else {
            console.error(`❌ Monitoring failed: ${result.error}`);
        }
    } catch (error) {
        console.error(`❌ Monitoring error:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
