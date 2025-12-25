/**
 * Product Export API
 * Export products to Excel/CSV file
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/admin/products/export
 * Export all products to Excel file
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

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'xlsx'; // xlsx or csv
        const categoryId = searchParams.get('categoryId');
        const status = searchParams.get('status');

        // Build query filters
        const where = {};
        if (categoryId) where.categoryId = categoryId;
        if (status) where.status = status;

        // Fetch all products
        const products = await prisma.product.findMany({
            where,
            include: {
                category: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform data for export
        const exportData = products.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            categoryId: product.categoryId,
            categoryName: product.category.name,
            basePrice: parseFloat(product.basePrice),
            salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
            stock: product.stock,
            weight: product.weight,
            images: JSON.stringify(product.images),
            status: product.status,
            isFeatured: product.isFeatured,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString()
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

        // Generate buffer
        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: format === 'csv' ? 'csv' : 'xlsx'
        });

        // Set headers for file download
        const headers = new Headers();
        headers.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename="products-export-${Date.now()}.${format}"`);

        return new NextResponse(buffer, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('[Product Export] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to export products',
                details: error.message
            },
            { status: 500 }
        );
    }
});
