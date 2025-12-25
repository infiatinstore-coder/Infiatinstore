import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { requireAuth } from '@/lib/auth';
// GET /api/auth/me - Get current user
export async function GET(request) {
    try {
        // Get token from header
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Token tidak ditemukan' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                status: true,
                createdAt: true,
                addresses: {
                    orderBy: { isDefault: 'desc' },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json(
                { error: 'Token tidak valid' },
                { status: 401 }
            );
        }
        if (error.name === 'TokenExpiredError') {
            return NextResponse.json(
                { error: 'Token kadaluarsa, silakan login ulang' },
                { status: 401 }
            );
        }
        console.error('Auth me error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan' },
            { status: 500 }
        );
    }
}

// PUT /api/auth/me - Update current user profile
export async function PUT(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Token tidak ditemukan' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const body = await request.json();
        const { name, phone, avatarUrl } = body;

        const user = await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(avatarUrl && { avatarUrl }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
            },
        });

        return NextResponse.json({
            message: 'Profil berhasil diperbarui',
            user,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan' },
            { status: 500 }
        );
    }
}
