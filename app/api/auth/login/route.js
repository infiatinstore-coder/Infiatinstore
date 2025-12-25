import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email/WhatsApp dan password wajib diisi' },
                { status: 400 }
            );
        }

        // Find user by email OR phone
        // Check if input looks like phone number (starts with 0 or +62 or contains only digits)
        const isPhone = /^(\+62|62|0)/.test(email) || /^\d+$/.test(email);

        let user;
        if (isPhone) {
            user = await prisma.user.findFirst({
                where: { phone: email },
            });
        } else {
            user = await prisma.user.findUnique({
                where: { email },
            });
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Email/WhatsApp atau password salah' },
                { status: 401 }
            );
        }

        // Check if user is suspended
        if (user.status === 'SUSPENDED') {
            return NextResponse.json(
                { error: 'Akun Anda telah dinonaktifkan. Hubungi customer service.' },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Email atau password salah' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await generateToken(user);

        // Return user data (without password)
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
        };

        // Create response with cookie
        const response = NextResponse.json({
            message: 'Login berhasil! Selamat datang kembali 👋',
            user: userData,
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
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
