import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/account/stats
 * Get user statistics (orders, wishlist, addresses count)
 */
export async function GET(request) {
    try {
        const auth = await verifyAuth(request);

        if (!auth.success) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const userId = auth.users.id;

        // Fetch all stats in parallel
        const [ordersCount, wishlistCount, addressesCount] = await Promise.all([
            prisma.orders.count({
                where: { user_id: userId }
            }),
            prisma.wishlists.count({
                where: { user_id: userId }
            }),
            prisma.addresses.count({
                where: { user_id: userId }
            })
        ]);

        return NextResponse.json({
            orders: ordersCount,
            wishlist: wishlistCount,
            addresses: addressesCount
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
