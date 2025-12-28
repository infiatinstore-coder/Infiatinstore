/**
 * API: Inspect Returned Item
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { returnManager } from '@/lib/returnManager';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    try {
        const auth = await verifyAuth(request);

        if (!auth.success || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user?.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const data = await request.json();

        const result = await returnManager.inspectReturnedItem(id, {
            inspectedBy: auth.users.id,
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
