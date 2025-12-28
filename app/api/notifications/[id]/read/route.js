/**
 * API: Mark Notification as Read
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { notificationService } from '@/lib/notificationService';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const notification = await notificationService.markAsRead(id);

        return NextResponse.json({
            success: true,
            notification
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
