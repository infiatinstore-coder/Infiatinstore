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

// POST /api/reviews/[id]/helpful - Mark review as helpful
export async function POST(request, { params }) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reviewId = params.id;

        // Check if review exists
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
        }

        // Check if user already marked this review as helpful
        const existingHelpful = await prisma.reviewHelpful.findFirst({
            where: {
                reviewId,
                userId: user.userId,
            },
        });

        if (existingHelpful) {
            // Remove helpful (toggle)
            await prisma.$transaction([
                prisma.reviewHelpful.delete({
                    where: { id: existingHelpful.id },
                }),
                prisma.review.update({
                    where: { id: reviewId },
                    data: {
                        helpfulCount: {
                            decrement: 1,
                        },
                    },
                }),
            ]);

            return NextResponse.json({
                message: 'Mark helpful removed',
                helpful: false,
            });
        } else {
            // Add helpful
            await prisma.$transaction([
                prisma.reviewHelpful.create({
                    data: {
                        reviewId,
                        userId: user.userId,
                    },
                }),
                prisma.review.update({
                    where: { id: reviewId },
                    data: {
                        helpfulCount: {
                            increment: 1,
                        },
                    },
                }),
            ]);

            return NextResponse.json({
                message: 'Review marked as helpful',
                helpful: true,
            });
        }
    } catch (error) {
        console.error('Mark helpful error:', error);
        return NextResponse.json({ error: 'Gagal memproses request' }, { status: 500 });
    }
}
