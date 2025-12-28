/**
 * API: Download Invoice (HTML version)
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { invoiceGenerator } from '@/lib/invoiceGenerator';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { id: invoiceId } = params;

        const invoice = await prisma.invoices.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Get order details
        const order = await prisma.orders.findUnique({
            where: { id: invoice.order_id },
            include: {
                order_items: {
                    include: {
                        products: true
                    }
                }
            }
        });

        // Generate HTML
        const html = invoiceGenerator.generateInvoiceHTML(invoice, order);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="${invoice.invoice_number}.html"`
            }
        });

    } catch (error) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
