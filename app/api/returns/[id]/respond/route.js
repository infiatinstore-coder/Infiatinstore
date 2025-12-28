/**
 * API: Respond to Return Request
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { returnManager } from '@/lib/returnManager';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    try {
        const auth = await verifyAuth(request);

        if (!auth.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const data = await request.json();

        const result = await returnManager.sellerRespond(id, {
            sellerId: auth.user.id,
            ...data
        });

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
