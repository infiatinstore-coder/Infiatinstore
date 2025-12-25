/**
 * Product Import API
 * Import products from Excel/CSV file
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * POST /api/admin/products/import
 * Import products from uploaded Excel/CSV file
 */
export const POST = requireAuth(async function POST(request, context) {
    try {
        // Check admin permission
        if (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Parse Excel/CSV
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: 'File is empty or invalid format' },
                { status: 400 }
            );
        }

        const results = {
            total: data.length,
            success: 0,
            failed: 0,
            errors: []
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Validate required fields
                if (!row.name || !row.categoryId || !row.basePrice) {
                    throw new Error('Missing required fields: name, categoryId, basePrice');
                }

                // Generate slug from name
                const slug = row.slug || row.name.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '') + '-' + Date.now();

                // Prepare product data
                const productData = {
                    name: row.name,
                    slug: slug,
                    description: row.description || '',
                    categoryId: row.categoryId,
                    basePrice: parseFloat(row.basePrice),
                    salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
                    stock: parseInt(row.stock || 0),
                    weight: parseInt(row.weight || 0),
                    images: row.images ? JSON.parse(row.images) : [],
                    status: row.status || 'ACTIVE',
                    isFeatured: row.isFeatured === 'true' || row.isFeatured === '1' || row.isFeatured === true
                };

                // Check if category exists
                const categoryExists = await prisma.category.findUnique({
                    where: { id: productData.categoryId }
                });

                if (!categoryExists) {
                    throw new Error(`Category not found: ${productData.categoryId}`);
                }

                // Create or update product
                if (row.id) {
                    // Update existing
                    await prisma.product.update({
                        where: { id: row.id },
                        data: productData
                    });
                } else {
                    // Create new
                    await prisma.product.create({
                        data: productData
                    });
                }

                results.success++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    data: row,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import completed: ${results.success} success, ${results.failed} failed`,
            results
        });

    } catch (error) {
        console.error('[Product Import] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to import products',
                details: error.message
            },
            { status: 500 }
        );
    }
});
