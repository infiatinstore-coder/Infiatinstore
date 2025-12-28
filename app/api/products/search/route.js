import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ProductSearchSchema, validateQuery } from '@/lib/validation';
import { ApiResponse, asyncHandler, logger } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rateLimit';
import { CacheKeys, CacheTTL, withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * ENHANCED Product Search API
 * - Input validation with Zod
 * - Rate limiting
 * - Redis caching
 * - Structured error handling
 * - Logging
 * 
 * This is how Shopee/Tokopedia does it!
 */

export const GET = asyncHandler(async function GET(request) {
    const startTime = Date.now();

    // Step 1: Rate limiting
    await checkRateLimit(request, 'search');

    // Step 2: Validate query parameters
    const { searchParams } = new URL(request.url);
    const params = validateQuery(ProductSearchSchema)(searchParams);

    const {
        q = '',
        category,
        minPrice = 0,
        maxPrice = 999999999,
        sortBy = 'newest',
        page = 1,
        limit = 12,
    } = params;

    // Step 3: Check cache
    const cacheKey = CacheKeys.productList({ q, category, minPrice, maxPrice, sortBy, page, limit });

    const cachedData = await withCache(cacheKey, async () => {
        // Step 4: Build query
        const where = {
            status: 'ACTIVE',
            AND: [
                // Search query
                q ? {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { description: { contains: q, mode: 'insensitive' } },
                    ],
                } : {},
                // Category filter
                category ? { category_id: category } : {},
                // Price range
                {
                    OR: [
                        {
                            sale_price: {
                                gte: minPrice,
                                lte: maxPrice,
                            },
                        },
                        {
                            AND: [
                                { sale_price: null },
                                {
                                    base_price: {
                                        gte: minPrice,
                                        lte: maxPrice,
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        // Step 5: Build orderBy
        let orderBy;
        switch (sortBy) {
            case 'cheapest':
                orderBy = [{ sale_price: 'asc' }, { base_price: 'asc' }];
                break;
            case 'expensive':
                orderBy = [{ sale_price: 'desc' }, { base_price: 'desc' }];
                break;
            case 'popular':
                orderBy = [{ is_featured: 'desc' }, { created_at: 'desc' }];
                break;
            case 'newest':
            default:
                orderBy = { created_at: 'desc' };
        }

        // Step 6: Execute query
        const [products, totalCount] = await Promise.all([
            prisma.products.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    categories: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    _count: {
                        select: {
                            reviews: true,
                        },
                    },
                },
            }),
            prisma.products.count({ where }),
        ]);

        // Step 7: Calculate ratings
        const productsWithRatings = await Promise.all(
            products.map(async (product) => {
                const avgRating = await prisma.reviews.aggregate({
                    where: {
                        product_id: product.id,
                        status: 'APPROVED',
                    },
                    _avg: {
                        rating: true,
                    },
                });

                return {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    images: product.images,
                    base_price: Number(product.base_price),
                    sale_price: product.sale_price ? Number(product.sale_price) : null,
                    stock: product.stock,
                    category: product.categories,
                    averageRating: avgRating._avg.rating || 0,
                    reviewCount: product._count.reviews,
                    is_featured: product.is_featured,
                };
            })
        );

        const totalPages = Math.ceil(totalCount / limit);

        return {
            products: productsWithRatings,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
            },
        };
    }, CacheTTL.PRODUCT_LIST);

    // Step 8: Log request
    const duration = Date.now() - startTime;
    logger.info('Product search', {
        query: q,
        category,
        sortBy,
        page,
        resultCount: cachedData.products.length,
        duration: `${duration}ms`,
    });

    // Step 9: Return paginated response
    return ApiResponse.paginated(
        cachedData.products,
        cachedData.pagination
    );
});

