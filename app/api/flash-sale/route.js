import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';


// GET /api/flash-sale - Get active flash sale with products
export async function GET() {
    try {
        const now = new Date();

        // Get current active flash sale
        const flashSale = await prisma.flash_sales.findFirst({
            where: {
                start_time: { lte: now },
                end_time: { gte: now },
                status: 'ACTIVE',
            },
            include: {
                products: {
                    include: {
                        products: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                base_price: true,
                                images: true,
                                stock: true,
                            },
                        },
                    },
                },
            },
        });

        if (!flashSale) {
            // Get upcoming flash sale
            const upcomingFlashSale = await prisma.flash_sales.findFirst({
                where: {
                    start_time: { gt: now },
                    status: 'UPCOMING',
                },
                orderBy: { start_time: 'asc' },
            });

            return NextResponse.json({
                active: false,
                upcoming: upcomingFlashSale ? {
                    id: upcomingFlashSale.id,
                    name: upcomingFlashSale.name,
                    start_time: upcomingFlashSale.startTime,
                } : null,
                products: [],
            });
        }

        // Format response
        const products = flashSale.products.map(fp => ({
            id: fp.product.id,
            name: fp.product.name,
            slug: fp.product.slug,
            image: fp.product.images?.[0] || null,
            originalPrice: Number(fp.product.base_price),
            sale_price: Number(fp.sale_price),
            discountPercent: Math.round((1 - Number(fp.sale_price) / Number(fp.product.base_price)) * 100),
            stock_limit: fp.stockLimit,
            sold_count: fp.soldCount,
            stockLeft: fp.stockLimit - fp.soldCount,
        }));

        return NextResponse.json({
            active: true,
            flashSale: {
                id: flashSale.id,
                name: flashSale.name,
                slug: flashSale.slug,
                bannerUrl: flashSale.bannerUrl,
                start_time: flashSale.startTime,
                end_time: flashSale.endTime,
            },
            products,
        });
    } catch (error) {
        console.error('Flash sale error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data flash sale' },
            { status: 500 }
        );
    }
}

