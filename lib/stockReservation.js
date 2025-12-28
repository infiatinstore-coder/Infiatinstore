/**
 * STOCK RESERVATION SYSTEM
 * Prevents race conditions during checkout
 * 
 * Flow:
 * 1. Checkout → Reserve stock (15 min hold)
 * 2. Payment → Confirm reservation  
 * 3. Expired → Auto-release stock
 */

import prisma from './prisma';

/**
 * Reserve stock atomically
 */
export async function reserveStock(orderId, items) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return await prisma.$transaction(async (tx) => {
        const reservations = [];

        for (const item of items) {
            // Check available stock
            const product = await tx.products.findUnique({
                where: { id: item.productId },
                select: { stock: true }
            });

            if (!product || product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.productId}`);
            }

            // Create reservation
            const reservation = await tx.stock_reservations.create({
                data: {
                    order_id: orderId,
                    product_id: item.productId,
                    variant_id: item.variantId || null,
                    quantity: item.quantity,
                    status: 'PENDING',
                    expires_at: expiresAt
                }
            });

            reservations.push(reservation);
        }

        return reservations;
    });
}

/**
 * Confirm reservation after payment
 */
export async function confirmReservation(orderId) {
    return await prisma.$transaction(async (tx) => {
        const reservations = await tx.stock_reservations.findMany({
            where: {
                order_id: orderId,
                status: 'PENDING'
            }
        });

        for (const reservation of reservations) {
            // Deduct stock permanently
            await tx.products.update({
                where: { id: reservation.product_id },
                data: {
                    stock: {
                        decrement: reservation.quantity
                    }
                }
            });

            // Mark reservation as confirmed
            await tx.stock_reservations.update({
                where: { id: reservation.id },
                data: {
                    status: 'CONFIRMED'
                }
            });
        }

        return reservations;
    });
}

/**
 * Release expired or cancelled reservations
 */
export async function releaseReservation(orderId, reason = 'cancelled') {
    return await prisma.$transaction(async (tx) => {
        const reservations = await tx.stock_reservations.findMany({
            where: {
                order_id: orderId,
                status: 'PENDING'
            }
        });

        for (const reservation of reservations) {
            await tx.stock_reservations.update({
                where: { id: reservation.id },
                data: {
                    status: 'RELEASED',
                    released_at: new Date()
                }
            });
        }

        console.log(`Released ${reservations.length} reservations for order ${orderId} (${reason})`);
        return reservations;
    });
}

/**
 * Cron job: Auto-release expired reservations
 * Run every 1 minute
 */
export async function releaseExpiredReservations() {
    const expired = await prisma.stock_reservations.findMany({
        where: {
            status: 'PENDING',
            expires_at: {
                lte: new Date()
            }
        }
    });

    console.log(`Found ${expired.length} expired reservations`);

    for (const reservation of expired) {
        await prisma.stock_reservations.update({
            where: { id: reservation.id },
            data: {
                status: 'RELEASED',
                released_at: new Date()
            }
        });

        console.log(`Auto-released reservation ${reservation.id} for order ${reservation.order_id}`);
    }

    return expired;
}

/**
 * Get reservation status
 */
export async function getReservationStatus(orderId) {
    return await prisma.stock_reservations.findMany({
        where: { order_id: orderId },
        include: {
            products: {
                select: { name: true }
            }
        }
    });
}
