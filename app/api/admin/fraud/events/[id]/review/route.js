/**
 * API: Review Fraud Event
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
    try {
        const auth = await verifyAuth(request);

        if (!auth.success || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user?.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { action, notes } = await request.json();

        const updated = await prisma.fraud_events?.update({
            where: { id },
            data: {
                status: action === 'dismiss' ? 'DISMISSED' : 'CONFIRMED',
                reviewed_by: auth.user.id,
                reviewed_at: new Date(),
                notes
            }
        });

        return NextResponse.json({
            success: true,
            data: updated
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
