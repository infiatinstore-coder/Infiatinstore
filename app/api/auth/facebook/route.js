/**
 * Facebook OAuth Login API
 * Handle Facebook authentication
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { generateToken } from '@/lib/auth';

import bcrypt from 'bcryptjs';


/**
 * POST /api/auth/facebook
 * Authenticate user with Facebook OAuth token
 * Body: { token: string, profile: object }
 */
export async function POST(request) {
    try {
        const { token, profile } = await request.json();

        if (!profile || !profile.email) {
            return NextResponse.json(
                { error: 'Invalid Facebook profile data' },
                { status: 400 }
            );
        }

        const { email, name, picture, id: facebookId } = profile;

        // Check if user exists
        let user = await prisma.users.findUnique({
            where: { email }
        });

        if (user) {
            // User exists - update profile if needed
            if (!user.avatar_url && picture) {
                user = await prisma.users.update({
                    where: { email },
                    data: {
                        avatar_url: picture?.data?.url || null,
                        email_verified_at: new Date(),
                        status: 'ACTIVE'
                    }
                });
            }
        } else {
            // Create new user
            // Generate random password for social login users
            const randomPassword = await bcrypt.hash(
                Math.random().toString(36) + Date.now(),
                10
            );

            user = await prisma.users.create({
                data: {
                    email,
                    name,
                    password_hash: randomPassword,
                    avatar_url: picture?.data?.url || null,
                    email_verified_at: new Date(),
                    status: 'ACTIVE',
                    role: 'CUSTOMER'
                }
            });

            // Create user points record
            await prisma.user_points.create({
                data: {
                    user_id: user.id,
                    balance: 100, // Welcome bonus
                    lifetime: 100
                }
            });

            // Log registration
            await prisma.point_transactions.create({
                data: {
                    user_id: user.id,
                    type: 'EARN_REFERRAL',
                    amount: 100,
                    balance: 100,
                    description: 'Welcome bonus for new registration'
                }
            });
        }

        // Generate JWT token
        const jwtToken = await generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        // Set cookie
        const response = NextResponse.json({
            success: true,
            users: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar_url: user.avatar_url
            },
            message: 'Login successful'
        });

        response.cookies.set('token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error('[Facebook Auth] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to authenticate with Facebook',
                details: error.message
            },
            { status: 500 }
        );
    }
}

