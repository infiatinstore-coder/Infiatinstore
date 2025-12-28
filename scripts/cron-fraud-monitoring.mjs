/**
 * FRAUD MONITORING CRON JOBS
 * Auto-block high risk users and cleanup
 */

import prisma from '../lib/prisma.js';
import { fraudDetectionService } from '../lib/fraudDetectionService.js';

/**
 * Auto-block users with critical risk score
 */
export async function autoBlockHighRisk() {
    const criticalUsers = await prisma.user_risk_profiles.findMany({
        where: {
            risk_score: { gte: 90 },
            is_blacklisted: false
        }
    });

    console.log(`Found ${criticalUsers.length} critical risk users...`);

    for (const profile of criticalUsers) {
        await fraudDetectionService.blockUser(
            profile.user_id,
            'Auto-blocked: Risk score 90+'
        );

        // TODO: Notify admin
        console.log(`  ✅ Blocked user ${profile.user_id}`);
    }

    return criticalUsers.length;
}

/**
 * Cleanup old fraud events (90 days retention)
 */
export async function cleanupOldFraudEvents() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.fraud_events.deleteMany({
        where: {
            created_at: { lt: ninetyDaysAgo },
            is_reviewed: true
        }
    });

    console.log(`Cleaned up ${result.count} old fraud events`);
    return result.count;
}

/**
 * Expire temporary blacklists
 */
export async function expireBlacklists() {
    const result = await prisma.blacklists.updateMany({
        where: {
            expires_at: { lte: new Date() },
            is_active: true
        },
        data: {
            is_active: false
        }
    });

    console.log(`Expired ${result.count} temporary blacklists`);
    return result.count;
}

/**
 * Decay user risk scores (reduce over time if no new events)
 */
export async function decayRiskScores() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find users with no recent fraud events
    const users = await prisma.user_risk_profiles.findMany({
        where: {
            risk_score: { gt: 0 },
            is_blacklisted: false,
            updated_at: { lt: thirtyDaysAgo }
        }
    });

    for (const profile of users) {
        const newScore = Math.max(0, profile.risk_score - 10); // Reduce by 10 points

        let riskLevel = 'LOW';
        if (newScore >= 80) riskLevel = 'CRITICAL';
        else if (newScore >= 60) riskLevel = 'HIGH';
        else if (newScore >= 30) riskLevel = 'MEDIUM';

        await prisma.user_risk_profiles.update({
            where: { id: profile.id },
            data: {
                risk_score: newScore,
                risk_level: riskLevel
            }
        });
    }

    console.log(`Decayed risk scores for ${users.length} users`);
    return users.length;
}

/**
 * Run all fraud monitoring jobs
 */
export async function runFraudMonitoring() {
    console.log('🚨 Running fraud monitoring jobs...');

    try {
        const blocked = await autoBlockHighRisk();
        const cleaned = await cleanupOldFraudEvents();
        const expired = await expireBlacklists();
        const decayed = await decayRiskScores();

        console.log('✅ Fraud monitoring complete:', {
            blocked,
            cleaned,
            expired,
            decayed
        });

        return { blocked, cleaned, expired, decayed };
    } catch (error) {
        console.error('❌ Fraud monitoring error:', error);
        throw error;
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runFraudMonitoring()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
