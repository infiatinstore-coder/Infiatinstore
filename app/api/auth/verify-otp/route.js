import { NextResponse } from 'next/server';
import { verifyWhatsAppOTP } from '@/lib/whatsapp-otp';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and activate user account
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, otp } = body;

        // Validation
        if (!phone || !otp) {
            return NextResponse.json(
                { error: 'Nomor WhatsApp dan kode OTP wajib diisi' },
                { status: 400 }
            );
        }

        // Validate OTP format (6 digits)
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

        // If userId exists, fetch user and generate token  
        if (result.userId) {
            const user = await prisma.user.findUnique({
                where: { id: result.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                },
            });

            if (user) {
                // Generate JWT token
                const token = await generateToken(user);

                // Create response with cookie
                const response = NextResponse.json({
                    success: true,
                    message: result.message,
                    user,
                    token,
                });

                // Set auth-token cookie
                response.cookies.set('auth-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7, // 7 days
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
