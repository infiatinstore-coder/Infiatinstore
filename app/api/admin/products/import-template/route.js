/**
 * Product Import Template API
 * Download Excel template for product import
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/admin/products/import-template
 * Download product import template
 */
export const GET = requireAuth(async function GET(request, context) {
    try {
        // Check admin permission
        if (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        // Get all categories for reference
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true
            }
        });

        // Create template with examples
        const templateData = [
            {
                id: '',
                name: 'Contoh Produk 1',
                slug: 'contoh-produk-1',
                description: 'Deskripsi produk contoh',
                categoryId: categories[0]?.id || 'CATEGORY_ID_HERE',
                basePrice: 100000,
                salePrice: 85000,
                stock: 50,
                weight: 500,
                images: '["https://example.com/image1.jpg","https://example.com/image2.jpg"]',
                status: 'ACTIVE',
                isFeatured: 'false'
            },
            {
                id: '',
                name: 'Contoh Produk 2',
                slug: 'contoh-produk-2',
                description: 'Produk kedua sebagai contoh',
                categoryId: categories[0]?.id || 'CATEGORY_ID_HERE',
                basePrice: 200000,
                salePrice: '',
                stock: 100,
                weight: 1000,
                images: '["https://example.com/image3.jpg"]',
                status: 'ACTIVE',
                isFeatured: 'true'
            }
        ];

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(templateData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 36 }, // id
            { wch: 30 }, // name
            { wch: 25 }, // slug
            { wch: 40 }, // description
            { wch: 36 }, // categoryId
            { wch: 12 }, // basePrice
            { wch: 12 }, // salePrice
            { wch: 8 },  // stock
            { wch: 8 },  // weight
            { wch: 50 }, // images
            { wch: 10 }, // status
            { wch: 10 }  // isFeatured
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

        // Create categories reference sheet
        const categoriesSheet = XLSX.utils.json_to_sheet(
            categories.map(cat => ({
                'Category ID': cat.id,
                'Category Name': cat.name
            }))
        );
        XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories Reference');

        // Create instructions sheet
        const instructions = [
            { Field: 'id', Description: 'Kosongkan untuk produk baru, isi untuk update produk existing', Required: 'No', Example: '' },
            { Field: 'name', Description: 'Nama produk', Required: 'Yes', Example: 'Kaos Polos Premium' },
            { Field: 'slug', Description: 'URL-friendly name (opsional, akan auto-generate)', Required: 'No', Example: 'kaos-polos-premium' },
            { Field: 'description', Description: 'Deskripsi produk lengkap', Required: 'Yes', Example: 'Kaos berkualitas tinggi...' },
            { Field: 'categoryId', Description: 'ID kategori (lihat sheet Categories Reference)', Required: 'Yes', Example: 'uuid-here' },
            { Field: 'basePrice', Description: 'Harga normal (angka tanpa titik/koma)', Required: 'Yes', Example: '100000' },
            { Field: 'salePrice', Description: 'Harga diskon (opsional)', Required: 'No', Example: '85000' },
            { Field: 'stock', Description: 'Jumlah stok', Required: 'Yes', Example: '50' },
            { Field: 'weight', Description: 'Berat dalam gram', Required: 'No', Example: '500' },
            { Field: 'images', Description: 'Array JSON URL gambar', Required: 'No', Example: '["url1","url2"]' },
            { Field: 'status', Description: 'Status produk', Required: 'No', Example: 'ACTIVE, INACTIVE, SOLD_OUT, ARCHIVED' },
            { Field: 'isFeatured', Description: 'Produk unggulan', Required: 'No', Example: 'true atau false' }
        ];

        const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
        instructionsSheet['!cols'] = [
            { wch: 15 },
            { wch: 50 },
            { wch: 10 },
            { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

        // Generate buffer
        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx'
        });

        // Set headers for file download
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename="product-import-template-${Date.now()}.xlsx"`);

        return new NextResponse(buffer, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('[Product Import Template] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate template',
                details: error.message
            },
            { status: 500 }
        );
    }
});
