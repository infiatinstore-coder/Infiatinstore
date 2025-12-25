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

// PUT /api/reviews/[id] - Update review
export async function PUT(request, { params }) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reviewId = params.id;
        const body = await request.json();
        const { rating, title, comment } = body;

        // Check if review exists and belongs to user
        const review = await prisma.review.findFirst({
            where: {
                id: reviewId,
                userId: user.userId,
            },
        });

        if (!review) {
            return NextResponse.json({
                error: 'Review tidak ditemukan atau Anda tidak memiliki akses'
            }, { status: 404 });
        }

        // Validation
        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json({
                error: 'Rating harus antara 1-5'
            }, { status: 400 });
        }

        // Update review
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                ...(rating && { rating }),
                ...(title !== undefined && { title }),
                ...(comment && { comment }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: 'Review berhasil diperbarui',
            review: updatedReview,
        });
    } catch (error) {
        console.error('Update review error:', error);
        return NextResponse.json({ error: 'Gagal memperbarui review' }, { status: 500 });
    }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(request, { params }) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reviewId = params.id;

        // Check if review exists and belongs to user
        const review = await prisma.review.findFirst({
            where: {
                id: reviewId,
                userId: user.userId,
            },
        });

        if (!review) {
            return NextResponse.json({
                error: 'Review tidak ditemukan atau Anda tidak memiliki akses'
            }, { status: 404 });
        }

        // Delete review
        await prisma.review.delete({
            where: { id: reviewId },
        });

        return NextResponse.json({
            message: 'Review berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete review error:', error);
        return NextResponse.json({ error: 'Gagal menghapus review' }, { status: 500 });
    }
}
