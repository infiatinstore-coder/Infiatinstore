/**
 * Sales Report Export API
 * Migrated to ExcelJS
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createExcelFromJSON, generateExcelBuffer } from '@/lib/excel-helpers';

export const GET = requireAuth(async function GET(request, context) {
    try {
        if (context.users.role !== 'ADMIN' && context.users.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where = {};
        if (startDate && endDate) {
            where.created_at = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const orders = await prisma.orders.findMany({
            where,
            include: {
                users: { select: { name: true, email: true } },
                items: { include: { products: { select: { name: true } } } }
            },
            orderBy: { created_at: 'desc' }
        });

        const data = orders.map(o => ({
            orderNumber: o.orderNumber,
            date: o.created_at.toISOString(),
            customer: o.user?.name || 'Guest',
            email: o.user?.email || o.guestEmail || '',
            items: o.items.map(i => i.product.name).join(', '),
            subtotal: Number(o.subtotal),
            shipping: Number(o.shippingCost),
            total: Number(o.total),
            status: o.status,
            payment_method: o.paymentMethod
        }));

        const workbook = await createExcelFromJSON(data, 'Sales Report');
        const buffer = await generateExcelBuffer(workbook);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });
    } catch (error) {
        console.error('[Sales Report] Error:', error);
        return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
    }
});

