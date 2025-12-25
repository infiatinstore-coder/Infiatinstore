import { NextResponse } from 'next/server';
import { getCities } from '@/lib/rajaongkir';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const provinceId = searchParams.get('province');

        const cities = await getCities(provinceId);

        return NextResponse.json({
            success: true,
            cities,
        });
    } catch (error) {
        console.error('Get cities error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cities', details: error.message },
            { status: 500 }
        );
    }
}
