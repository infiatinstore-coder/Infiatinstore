import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token verifikasi diperlukan' },
                { status: 400 }
            );
        }

        // Hash the token to match stored version
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with matching verification token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: hashedToken,
                verificationTokenExpires: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Token tidak valid atau sudah kadaluarsa' },
                { status: 400 }
            );
        }

        // Update user as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifiedAt: new Date(),
                verificationToken: null,
                verificationTokenExpires: null,
                status: 'ACTIVE',
            },
        });

        console.log('✅ Email verified for user:', user.email);

        return NextResponse.json({
            success: true,
            message: 'Email berhasil diverifikasi! Silakan login.',
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json(
            { error: 'Gagal memverifikasi email' },
            { status: 500 }
        );
    }
}
