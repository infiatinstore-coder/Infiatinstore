import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * POST /api/admin/products/bulk-upload
 * Upload products via Excel file
 */
export async function POST(request) {
    try {
        // Verify admin auth
        const auth = await verifyAuth(request);
        if (!auth.success || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'File diperlukan' }, { status: 400 });
        }

        // Read Excel file
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'File kosong' }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [],
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Validate required fields
                if (!row.name || !row.basePrice || !row.category) {
                    throw new Error(`Baris ${i + 2}: Field wajib (name, basePrice, category) tidak lengkap`);
                }

                // Create product
                await prisma.product.create({
                    data: {
                        name: String(row.name),
                        slug: String(row.name)
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, ''),
                        description: row.description ? String(row.description) : '',
                        basePrice: parseFloat(row.basePrice),
                        salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
                        stock: row.stock ? parseInt(row.stock) : 0,
                        category: String(row.category),
                        weight: row.weight ? parseInt(row.weight) : 0,
                        images: row.images ? String(row.images).split(',') : [],
                        status: row.status || 'ACTIVE',
                        isFeatured: row.isFeatured === 'TRUE' || row.isFeatured === true,
                        isNew: row.isNew === 'TRUE' || row.isNew === true,
                        tags: row.tags ? String(row.tags).split(',') : [],
                    },
                });

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    name: row.name || '-',
                    error: error.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Upload selesai: ${results.success} berhasil, ${results.failed} gagal`,
            results,
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        return NextResponse.json(
            { error: 'Gagal upload produk: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/products/bulk-upload
 * Download Excel template
 */
export async function GET() {
    try {
        // Create template
        const template = [
            {
                name: 'Contoh Produk 1',
                description: 'Deskripsi produk',
                basePrice: 100000,
                salePrice: 90000,
                stock: 10,
                category: 'kurma-buah-kering',
                weight: 500,
                images: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
                status: 'ACTIVE',
                isFeatured: 'TRUE',
                isNew: 'FALSE',
                tags: 'premium,best-seller',
            },
            {
                name: 'Contoh Produk 2',
                description: 'Deskripsi produk 2',
                basePrice: 150000,
                salePrice: '',
                stock: 20,
                category: 'air-zamzam',
                weight: 1000,
                images: '',
                status: 'ACTIVE',
                isFeatured: 'FALSE',
                isNew: 'TRUE',
                tags: 'new-arrival',
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(template);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, // name
            { wch: 50 }, // description
            { wch: 12 }, // basePrice
            { wch: 12 }, // salePrice
            { wch: 8 },  // stock
            { wch: 20 }, // category
            { wch: 8 },  // weight
            { wch: 60 }, // images
            { wch: 10 }, // status
            { wch: 12 }, // isFeatured
            { wch: 10 }, // isNew
            { wch: 20 }, // tags
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Produk');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="template-bulk-upload-produk.xlsx"',
            },
        });

    } catch (error) {
        console.error('Template download error:', error);
        return NextResponse.json(
            { error: 'Gagal download template' },
            { status: 500 }
        );
    }
}
