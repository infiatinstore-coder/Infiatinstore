import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/settings - Get all public settings
export async function GET() {
    try {
        const settings = await prisma.settings.findMany({
            where: {
                is_public: true,
            },
            select: {
                key: true,
                value: true,
            },
        });

        // Convert to key-value object for easier access
        const settingsObject = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});

        return NextResponse.json(settingsObject);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}
