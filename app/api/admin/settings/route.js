import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings - Get all settings (admin only)
export async function GET(request) {
    try {
        const auth = await verifyAuth(request);

        if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.settings.findMany({
            orderBy: { key: 'asc' },
        });

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/settings - Update settings (admin only)
export async function PUT(request) {
    try {
        const auth = await verifyAuth(request);

        if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { settings } = await request.json();

        if (!Array.isArray(settings)) {
            return NextResponse.json(
                { error: 'Settings must be an array' },
                { status: 400 }
            );
        }

        // Update each setting
        const updatePromises = settings.map((setting) =>
            prisma.settings.update({
                where: { id: setting.id },
                data: {
                    value: setting.value,
                    updated_at: new Date(),
                },
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({
            message: 'Settings updated successfully',
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
