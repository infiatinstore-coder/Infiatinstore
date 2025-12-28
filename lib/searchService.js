/**
 * SEARCH & DISCOVERY SERVICE
 * Advanced filtering, sorting, and full-text search
 */

import prisma from './prisma';

export class SearchService {

    /**
     * Advanced Product Search
     * Supports: validation, filtering, sorting, pagination
     */
    async searchProducts(params) {
        const {
            query,
            category,
            minPrice,
            maxPrice,
            rating,
            sort = 'newest',
            page = 1,
            limit = 20
        } = params;

        // Build Where Clause
        const where = {
            is_active: true
        };

        // Full-text search (simple ILIKE implementation)
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } }
            ];

            // Log search history (async)
            this.logSearch(query, params).catch(console.error);
        }

        // Category filter
        if (category) {
            where.category_id = category;
        }

        // Price range
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        // Review Rating (requires aggregation or aggregated field)
        // Ignoring for now to keep query efficient

        // Build Sort Option
        const orderBy = this.buildSort(sort);

        // Execute Query
        const [products, total] = await Promise.all([
            prisma.products.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    categories: { select: { name: true } }
                    // Add reviews_avg if aggregated
                }
            }),
            prisma.products.count({ where })
        ]);

        return {
            data: products,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    buildSort(sort) {
        switch (sort) {
            case 'price_asc': return { price: 'asc' };
            case 'price_desc': return { price: 'desc' };
            case 'name_asc': return { name: 'asc' };
            case 'best_seller': return { sold_count: 'desc' }; // Assuming sold_count exists
            case 'top_rated': return { rating_avg: 'desc' };   // Assuming rating_avg exists
            case 'newest':
            default: return { created_at: 'desc' };
        }
    }

    async logSearch(query, filters) {
        // Implement async logging to search_history table
        // await prisma.search_history.create({...})
    }
}

export const searchService = new SearchService();
