import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/admin/reports/sales
 * Generate sales report with filtering
 * Query params: startDate, endDate, format (json|excel)
 */
export async function GET(request) {
    try {
        // Verify admin auth
        const auth = await verifyAuth(request);
        if (!auth.success || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const format = searchParams.get('format') || 'json';

        // Date filtering
        const where = {
            status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
        };

        if (startDate) {
            where.createdAt = {
                ...where.createdAt,
                gte: new Date(startDate),
            };
        }

        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999); // End of day
            where.createdAt = {
                ...where.createdAt,
                lte: endDateTime,
            };
        }

        // Fetch orders with details
        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true },
                },
                items: {
                    include: {
                        product: {
                            select: { name: true },
                        },
                    },
                },
                payment: {
                    select: { paymentMethod: true, paidAt: true },
                },
                shipment: {
                    select: { courier: true, serviceType: true, trackingNumber: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate summary
        const summary = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + Number(order.total), 0),
            totalShipping: orders.reduce((sum, order) => sum + Number(order.shippingCost), 0),
            totalDiscount: orders.reduce((sum, order) => sum + Number(order.discount), 0),
            totalTax: orders.reduce((sum, order) => sum + Number(order.tax), 0),
            avgOrderValue: 0,
        };

        summary.avgOrderValue = summary.totalOrders > 0
            ? summary.totalRevenue / summary.totalOrders
            : 0;

        if (format === 'excel') {
            return generateExcelReport(orders, summary, startDate, endDate);
        }

        // JSON response
        return NextResponse.json({
            success: true,
            summary,
            orders: orders.map(order => ({
                orderNumber: order.orderNumber,
                date: order.createdAt,
                customer: order.user?.name || order.guestName || 'Guest',
                email: order.user?.email || order.guestEmail || '-',
                items: order.items.length,
                subtotal: Number(order.subtotal),
                shipping: Number(order.shippingCost),
                discount: Number(order.discount),
                tax: Number(order.tax),
                total: Number(order.total),
                status: order.status,
                paymentMethod: order.payment?.paymentMethod || order.paymentMethod || '-',
                courier: order.shipment?.courier || '-',
                trackingNumber: order.shipment?.trackingNumber || '-',
            })),
        });

    } catch (error) {
        console.error('Sales report error:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}

/**
 * Generate Excel report
 */
function generateExcelReport(orders, summary, startDate, endDate) {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
        ['LAPORAN PENJUALAN - INFIATIN STORE'],
        [''],
        ['Periode', startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua'],
        ['Tanggal Generate', new Date().toLocaleString('id-ID')],
        [''],
        ['RINGKASAN'],
        ['Total Pesanan', summary.totalOrders],
        ['Total Pendapatan', summary.totalRevenue],
        ['Total Ongkir', summary.totalShipping],
        ['Total Diskon', summary.totalDiscount],
        ['Total Pajak', summary.totalTax],
        ['Rata-rata Nilai Order', Math.round(summary.avgOrderValue)],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

    // Sheet 2: Detailed Orders
    const ordersData = [
        [
            'No Order',
            'Tanggal',
            'Pelanggan',
            'Email',
            'Jumlah Item',
            'Subtotal',
            'Ongkir',
            'Diskon',
            'Pajak',
            'Total',
            'Status',
            'Metode Bayar',
            'Kurir',
            'No Resi'
        ],
    ];

    orders.forEach(order => {
        ordersData.push([
            order.orderNumber,
            new Date(order.createdAt).toLocaleDateString('id-ID'),
            order.user?.name || order.guestName || 'Guest',
            order.user?.email || order.guestEmail || '-',
            order.items.length,
            Number(order.subtotal),
            Number(order.shippingCost),
            Number(order.discount),
            Number(order.tax),
            Number(order.total),
            order.status,
            order.payment?.paymentMethod || order.paymentMethod || '-',
            order.shipment?.courier || '-',
            order.shipment?.trackingNumber || '-',
        ]);
    });

    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);

    // Set column widths
    ordersSheet['!cols'] = [
        { wch: 20 }, // Order Number
        { wch: 12 }, // Date
        { wch: 20 }, // Customer
        { wch: 25 }, // Email
        { wch: 10 }, // Items
        { wch: 12 }, // Subtotal
        { wch: 10 }, // Shipping
        { wch: 10 }, // Discount
        { wch: 10 }, // Tax
        { wch: 12 }, // Total
        { wch: 12 }, // Status
        { wch: 15 }, // Payment
        { wch: 10 }, // Courier
        { wch: 18 }, // Tracking
    ];

    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Detail Pesanan');

    // Sheet 3: Products Sold
    const productSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const productName = item.product?.name || 'Unknown Product';
            if (!productSales[productName]) {
                productSales[productName] = {
                    quantity: 0,
                    revenue: 0,
                };
            }
            productSales[productName].quantity += item.quantity;
            productSales[productName].revenue += Number(item.subtotal);
        });
    });

    const productData = [
        ['Produk', 'Terjual (unit)', 'Total Pendapatan'],
    ];

    Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([product, data]) => {
            productData.push([product, data.quantity, data.revenue]);
        });

    const productSheet = XLSX.utils.aoa_to_sheet(productData);
    productSheet['!cols'] = [
        { wch: 40 }, // Product name
        { wch: 15 }, // Quantity
        { wch: 15 }, // Revenue
    ];
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Produk Terjual');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `Laporan-Penjualan-${startDate || 'all'}-${endDate || 'all'}.xlsx`;

    return new NextResponse(excelBuffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
