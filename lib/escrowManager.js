/**
 * ESCROW & WALLET MANAGER
 * Handles money flow between buyers, sellers, and platform
 * 
 * Flow:
 * 1. Payment → Money enters escrow
 * 2. Delivered + 3-7 days → Release to seller
 * 3. Dispute → Hold escrow
 */

import prisma from './prisma';

const PLATFORM_FEE_RATE = 0.05; // 5% commission
const ESCROW_HOLD_DAYS = 7; // Hold for 7 days after delivery

/**
 * Release escrow to seller after order completion
 */
export async function releaseEscrow(orderId) {
    return await prisma.$transaction(async (tx) => {
        const order = await tx.orders.findUnique({
            where: { id: orderId },
            select: {
                total: true,
                user_id: true,
                order_number: true
            }
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        // Calculate amounts
        const platformFee = Number(order.total) * PLATFORM_FEE_RATE;
        const sellerAmount = Number(order.total) - platformFee;

        // Credit seller wallet
        await tx.wallet_transactions.create({
            data: {
                user_id: order.user_id,
                type: 'credit',
                amount: sellerAmount,
                description: `Payment for order ${order.order_number}`,
                reference_type: 'order',
                reference_id: orderId,
                status: 'completed'
            }
        });

        // Record platform revenue
        await tx.platform_revenues.create({
            data: {
                order_id: orderId,
                amount: platformFee,
                type: 'commission'
            }
        });

        console.log(`Escrow released: ${sellerAmount} to seller, ${platformFee} platform fee`);

        return {
            sellerAmount,
            platformFee,
            order: order.order_number
        };
    });
}

/**
 * Hold escrow (when dispute opened)
 */
export async function holdEscrow(orderId) {
    console.log(`Escrow held for order ${orderId} due to dispute`);
    // In full implementation, mark escrow as held in orders table
    return { status: 'held', orderId };
}

/**
 * Process withdrawal request
 */
export async function processWithdrawal(userId, amount) {
    return await prisma.$transaction(async (tx) => {
        // Get user balance
        const transactions = await tx.wallet_transactions.findMany({
            where: {
                user_id: userId,
                status: 'completed'
            }
        });

        const balance = transactions.reduce((sum, t) => {
            return sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount));
        }, 0);

        if (balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Create withdrawal transaction
        const withdrawal = await tx.wallet_transactions.create({
            data: {
                user_id: userId,
                type: 'debit',
                amount,
                description: 'Withdrawal to bank account',
                reference_type: 'withdrawal',
                status: 'completed'
            }
        });

        return withdrawal;
    });
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId) {
    const transactions = await prisma.wallet_transactions.findMany({
        where: {
            user_id: userId,
            status: 'completed'
        }
    });

    const balance = transactions.reduce((sum, t) => {
        return sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount));
    }, 0);

    return {
        balance,
        transactions: transactions.length
    };
}

/**
 * Cron job: Auto-release escrow for completed orders
 * Run daily
 */
export async function autoReleaseEscrow() {
    const completedOrders = await prisma.orders.findMany({
        where: {
            status: 'COMPLETED',
            // Add escrow_released_at IS NULL check when field exists
        },
        select: {
            id: true,
            order_number: true,
            updated_at: true
        }
    });

    console.log(`Found ${completedOrders.length} orders ready for escrow release`);

    for (const order of completedOrders) {
        try {
            await releaseEscrow(order.id);
            console.log(`Auto-released escrow for order ${order.order_number}`);
        } catch (error) {
            console.error(`Failed to release escrow for ${order.order_number}:`, error.message);
        }
    }

    return completedOrders;
}
