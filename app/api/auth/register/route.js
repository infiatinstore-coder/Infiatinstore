import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { sendWhatsAppOTP } from '@/lib/whatsapp-otp';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone, password } = body;

        // Validation - require at least email OR phone
        if (!name || !password) {
            return NextResponse.json(
                { error: 'Nama dan password wajib diisi' },
                { status: 400 }
            );
        }

        if (!email && !phone) {
            return NextResponse.json(
                { error: 'Email atau nomor WhatsApp wajib diisi' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password minimal 8 karakter' },
                { status: 400 }
            );
        }

        // Check if email already exists (if email provided)
        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            if (existingEmail) {
                return NextResponse.json(
                    { error: 'Email sudah terdaftar. Silakan gunakan email lain.' },
                    { status: 400 }
                );
            }
        }

        // Check if phone already exists (if phone provided)
        if (phone) {
            const existingPhone = await prisma.user.findFirst({
                where: { phone: phone },
            });

            if (existingPhone) {
                return NextResponse.json(
                    { error: 'Nomor WhatsApp sudah terdaftar. Silakan gunakan nomor lain.' },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        // Create user data
        const userData = {
            name,
            passwordHash,
            role: 'CUSTOMER',
            status: email ? 'UNVERIFIED' : 'ACTIVE', // Auto-active if no email (phone only)
            verificationToken: hashedToken,
            verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        // Add email if provided
        if (email) {
            userData.email = email.toLowerCase();
        }

        // Add phone if provided
        if (phone) {
            userData.phone = phone;
        }

        // Create user
        const user = await prisma.user.create({
            data: userData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        // Send verification email (async, don't wait) - only if email provided
        if (email) {
            sendVerificationEmail(user, verificationToken).catch((error) => {
                console.error('Failed to send verification email:', error);
                // Don't fail registration if email fails
            });
        }

        // Send WhatsApp OTP - only if phone-only registration
        if (phone && !email) {
            sendWhatsAppOTP(phone, user.id, 'REGISTRATION').catch((error) => {
                console.error('Failed to send WhatsApp OTP:', error);
                // Don't fail registration if OTP send fails
            });
        }

        // Generate JWT token
        const token = await generateToken(user);

        console.log('✅ User registered:', email || phone);

        return NextResponse.json(
            {
                message: email
                    ? 'Registrasi berhasil! Silakan cek email untuk verifikasi.'
                    : 'Registrasi berhasil! Akun Anda sudah aktif.',
                user,
                token,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
