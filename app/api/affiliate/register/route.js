/**
 * Affiliate Registration API
 * Register as affiliate/reseller
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { requireAuth } from '@/lib/auth';


/**
 * POST /api/affiliate/register
 * Register current user as affiliate
 */
export const POST = requireAuth(async function POST(request, context) {
    try {
        const { bankAccount } = await request.json();

        // Check if already registered
        const existing = await prisma.affiliates.findUnique({
            where: { user_id: context.users.id }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Already registered as affiliate' },
                { status: 400 }
            );
        }

        // Generate unique referral code
        const referralCode = `REF${context.users.id.substring(0, 8).toUpperCase()}`;

        // Create affiliate record
        const affiliate = await prisma.affiliates.create({
            data: {
                user_id: context.users.id,
                referralCode,
                bankAccount,
                tier: 'BRONZE',
                commission_rate: 0.05 // 5% default
            }
        });

        return NextResponse.json({
            success: true,
            affiliates: {
                id: affiliate.id,
                referral_code: affiliate.referralCode,
                tier: affiliate.tier,
                commission_rate: parseFloat(affiliate.commissionRate)
            }
        });

    } catch (error) {
        console.error('[Affiliate Register] Error:', error);
        return NextResponse.json(
            { error: 'Failed to register affiliate', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * GET /api/affiliate/register
 * Get current affiliate status
 */
export const GET = requireAuth(async function GET(request, context) {
    try {
        const affiliate = await prisma.affiliates.findUnique({
            where: { user_id: context.users.id },
            include: {
                _count: {
                    select: {
                        referrals: true,
                        commissions: true
                    }
                }
            }
        });

        if (!affiliate) {
            return NextResponse.json({
                registered: false
            });
        }

        return NextResponse.json({
            registered: true,
            affiliates: {
                id: affiliate.id,
                referral_code: affiliate.referralCode,
                tier: affiliate.tier,
                commission_rate: parseFloat(affiliate.commissionRate),
                total_earnings: parseFloat(affiliate.totalEarnings),
                available_balance: parseFloat(affiliate.availableBalance),
                total_referrals: affiliate._count.referrals,
                totalCommissions: affiliate._count.commissions,
                status: affiliate.status
            }
        });

    } catch (error) {
        console.error('[Affiliate Status] Error:', error);
        return NextResponse.json(
            { error: 'Failed to get affiliate status', details: error.message },
            { status: 500 }
        );
    }
});

