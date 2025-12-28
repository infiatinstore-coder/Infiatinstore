import { NextResponse } from 'next/server';

/**
 * Placeholder Image API
 * Returns a simple gray placeholder
 * Usage: /api/placeholder/800x600 or /api/placeholder/400
 */
export async function GET(request, { params }) {
    const { dimensions } = params;

    // Parse dimensions
    let width, height;
    if (dimensions.includes('x')) {
        [width, height] = dimensions.split('x').map(Number);
    } else {
        width = height = Number(dimensions);
    }

    // Default to 400x400 if invalid
    if (!width || !height || width > 2000 || height > 2000) {
        width = height = 400;
    }

    // Create simple gray SVG
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#e5e7eb"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${width} × ${height}</text></svg>`;

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400',
        },
    });
}
