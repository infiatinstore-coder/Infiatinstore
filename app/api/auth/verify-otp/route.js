import { NextResponse } from 'next/server';
import { verifyWhatsAppOTP } from '@/lib/whatsapp-otp';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and activate user account
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, otp } = body;

        if (!phone || !otp) {
            return NextResponse.json(
                { error: 'Nomor WhatsApp dan kode OTP wajib diisi' },
                { status: 400 }
            );
        }

        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json(
                { error: 'Kode OTP harus 6 digit angka' },
                { status: 400 }
            );
        }

        // Verify OTP
        const result = await verifyWhatsAppOTP(phone, otp);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        // If userId exists, fetch user
        if (result.userId) {
            const user = await prisma.users.findUnique({
                where: { id: result.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    avatar_url: true,
                    password_hash: true,
                },
            });

            if (user) {
                // Check if user needs to complete profile (new 2-step registration)
                if (user.status === 'PENDING' || !user.name || !user.password_hash) {
                    // Update status to UNVERIFIED (phone verified but profile incomplete)
                    await prisma.users.update({
                        where: { id: user.id },
                        data: { status: 'UNVERIFIED' }
                    });

                    return NextResponse.json({
                        success: true,
                        message: 'OTP terverifikasi',
                        needCompleteProfile: true,
                        user_id: user.id,
                    });
                }

                // User already complete - generate token and login
                const token = await generateToken(user);
                const { passwordHash, ...safeUser } = user;

                const response = NextResponse.json({
                    success: true,
                    message: result.message,
                    users: safeUser,
                    token,
                });

                response.cookies.set('auth-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                    path: '/',
                });

                return response;
            }
        }

        // OTP verified but no user (standalone verification)
        return NextResponse.json({
            success: true,
            message: result.message,
        });

    } catch (error) {
        console.error('Verify OTP API error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}

