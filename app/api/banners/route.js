
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Static banners data (model belum ada di schema)
        const banners = [
            {
                id: '1',
                title: 'Flash Sale Ramadhan 2026',
                subtitle: 'Diskon hingga 50%',
                image_url: '/images/banners/banner-ramadhan.jpg',
                link: '/flash-sale',
                is_active: true,
                order: 1
            },
            {
                id: '2',
                title: 'Kurma Premium',
                subtitle: 'Kualitas terbaik untuk Anda',
                image_url: '/images/banners/banner-kurma.jpg',
                link: '/products?category=kurma',
                is_active: true,
                order: 2
            }
        ];

        return NextResponse.json(banners);
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch banners' },
            { status: 500 }
        );
    }
}
