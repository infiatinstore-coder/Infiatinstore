/**
 * REVIEW & RATING MANAGER
 * Handling product reviews with verification
 */

import prisma from './prisma';

export class ReviewManager {

    async addReview(userId, productId, data) {
        const { rating, comment, photos, orderId } = data;

        // Verify verified purchase
        let isVerified = false;
        if (orderId) {
            const order = await prisma.orders.findFirst({
                where: {
                    id: orderId,
                    user_id: userId,
                    status: 'COMPLETED',
                    items: { some: { product_id: productId } }
                }
            });
            if (order) isVerified = true;
        }

        const review = await prisma.product_reviews.create({
            data: {
                user_id: userId,
                product_id: productId,
                order_id: orderId,
                rating,
                comment,
                photos: photos || [],
                is_verified: isVerified,
                is_with_photo: !!(photos && photos.length > 0),
                status: 'APPROVED' // Auto-approve for now, or 'PENDING' for moderation
            }
        });

        // Update product aggregate rating
        await this.updateProductRating(productId);

        return review;
    }

    async updateProductRating(productId) {
        const aggregates = await prisma.product_reviews.aggregate({
            where: {
                product_id: productId,
                status: 'APPROVED'
            },
            _avg: { rating: true },
            _count: { rating: true }
        });

        // Assuming products table has rating fields
        /*
        await prisma.products.update({
            where: { id: productId },
            data: {
                rating_avg: aggregates._avg.rating || 0,
                rating_count: aggregates._count.rating || 0
            }
        });
        */
    }

    async getProductReviews(productId, params) {
        const { page = 1, limit = 10, withPhoto = false } = params;

        const where = {
            product_id: productId,
            status: 'APPROVED'
        };

        if (withPhoto) {
            where.is_with_photo = true;
        }

        return await prisma.product_reviews.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: { select: { name: true, avatar: true } }
            }
        });
    }
}

export const reviewManager = new ReviewManager();
