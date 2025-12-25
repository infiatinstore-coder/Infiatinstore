import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { requireAuth } from '@/lib/auth';
async function getAuthUser(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.split(' ')[1];
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// GET /api/addresses - Get user addresses
export async function GET(request) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: user.userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });

        return NextResponse.json({ addresses });
    } catch (error) {
        console.error('Get addresses error:', error);
        return NextResponse.json({ error: 'Gagal mengambil data alamat' }, { status: 500 });
    }
}

// POST /api/addresses - Create new address
export async function POST(request) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { label, recipientName, phone, fullAddress, province, city, district, postalCode, isDefault } = body;

        // Validation
        if (!recipientName || !phone || !fullAddress || !city || !postalCode) {
            return NextResponse.json({ error: 'Data alamat tidak lengkap' }, { status: 400 });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: user.userId },
                data: { isDefault: false },
            });
        }

        const address = await prisma.address.create({
            data: {
                userId: user.userId,
                label: label || 'HOME',
                recipientName,
                phone,
                fullAddress,
                province: province || '',
                city,
                district: district || '',
                postalCode,
                isDefault: isDefault || false,
            },
        });

        return NextResponse.json({
            message: 'Alamat berhasil ditambahkan',
            address,
        }, { status: 201 });
    } catch (error) {
        console.error('Create address error:', error);
        return NextResponse.json({ error: 'Gagal menambahkan alamat' }, { status: 500 });
    }
}
