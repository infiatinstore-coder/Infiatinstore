/**
 * INVOICE GENERATOR
 * Generate PDF invoices (simple HTML-based version)
 * For full React-PDF implementation, install @react-pdf/renderer
 */

import prisma from './prisma';
import { taxCalculator } from './taxCalculator';

export class InvoiceGenerator {

    /**
     * Generate next invoice number with format: INV-YYYY-MM-XXXXX
     */
    async generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Get or create sequence
        const sequence = await prisma.$transaction(async (tx) => {
            let seq = await tx.invoice_sequences.findUnique({
                where: {
                    year_month: { year, month }
                }
            });

            if (!seq) {
                seq = await tx.invoice_sequences.create({
                    data: {
                        year,
                        month,
                        last_sequence: 1
                    }
                });
            } else {
                seq = await tx.invoice_sequences.update({
                    where: { id: seq.id },
                    data: {
                        last_sequence: { increment: 1 }
                    }
                });
            }

            return seq;
        });

        const paddedSequence = String(sequence.last_sequence).padStart(5, '0');
        const paddedMonth = String(month).padStart(2, '0');

        return `INV-${year}-${paddedMonth}-${paddedSequence}`;
    }

    /**
     * Create invoice for order
     */
    async createInvoice(orderId) {
        // Get order with details
        const order = await prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                users: true,
                order_items: {
                    include: {
                        products: true
                    }
                }
            }
        });

        if (!order) throw new Error('Order not found');
        if (order.has_invoice) throw new Error('Invoice already exists');

        // Calculate tax
        const items = order.order_items.map(item => ({
            product: item.products,
            quantity: item.quantity,
            price: item.price
        }));

        const taxCalc = taxCalculator.calculateOrderTax(items);

        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber();

        // Get company info
        const companyInfo = {
            name: process.env.COMPANY_NAME || 'Infiatin Store',
            npwp: process.env.COMPANY_NPWP || '-',
            address: process.env.COMPANY_ADDRESS || 'Indonesia',
            phone: process.env.COMPANY_PHONE || '-',
            email: process.env.COMPANY_EMAIL || 'info@infiatin.store'
        };

        // Create invoice record
        const invoice = await prisma.invoices.create({
            data: {
                invoice_number: invoiceNumber,
                order_id: orderId,
                user_id: order.user_id,

                // Company
                company_name: companyInfo.name,
                company_npwp: companyInfo.npwp,
                company_address: companyInfo.address,

                // Buyer
                buyer_name: order.users.name,
                buyer_email: order.users.email,
                buyer_address: order.shipping_address || '-',

                // Amounts
                subtotal: taxCalc.subtotal,
                taxable_amount: taxCalc.taxableAmount,
                tax_exempt_amount: taxCalc.taxExemptAmount,
                total_tax: taxCalc.totalTax,
                shipping_cost: order.shipping_cost || 0,
                total_amount: taxCalculator.calculateTotal(
                    taxCalc.subtotal,
                    taxCalc.totalTax,
                    Number(order.shipping_cost || 0)
                ),

                status: 'ACTIVE'
            }
        });

        // Update order
        await prisma.orders.update({
            where: { id: orderId },
            data: {
                has_invoice: true,
                tax_amount: taxCalc.totalTax
            }
        });

        return invoice;
    }

    /**
     * Generate simple HTML invoice (can be converted to PDF)
     */
    generateInvoiceHTML(invoice, order) {
        const formatRupiah = (amount) => taxCalculator.formatRupiah(amount);
        const formatDate = (date) => new Date(date).toLocaleDateString('id-ID');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company { font-size: 20px; font-weight: bold; }
        .invoice-info { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background-color: #f0f0f0; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">${invoice.company_name}</div>
        <div>NPWP: ${invoice.company_npwp}</div>
        <div>${invoice.company_address}</div>
    </div>
    
    <h2>FAKTUR PAJAK</h2>
    
    <div class="invoice-info">
        <table>
            <tr>
                <td width="50%">
                    <strong>Invoice Number:</strong> ${invoice.invoice_number}<br>
                    <strong>Tanggal:</strong> ${formatDate(invoice.issued_at)}<br>
                    <strong>Order ID:</strong> ${order.order_number}
                </td>
                <td width="50%">
                    <strong>Kepada:</strong><br>
                    ${invoice.buyer_name}<br>
                    ${invoice.buyer_email}<br>
                    ${invoice.buyer_address || '-'}
                    ${invoice.buyer_npwp ? `<br>NPWP: ${invoice.buyer_npwp}` : ''}
                </td>
            </tr>
        </table>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="text-right">Harga</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            ${order.order_items.map(item => `
                <tr>
                    <td>${item.products.name}</td>
                    <td>${item.quantity}</td>
                    <td class="text-right">${formatRupiah(item.price)}</td>
                    <td class="text-right">${formatRupiah(Number(item.price) * item.quantity)}</td>
                </tr>
            `).join('')}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td class="text-right">${formatRupiah(invoice.subtotal)}</td>
            </tr>
            <tr>
                <td colspan="3">Dasar Pengenaan Pajak (DPP)</td>
                <td class="text-right">${formatRupiah(invoice.taxable_amount)}</td>
            </tr>
            <tr>
                <td colspan="3">PPN 11%</td>
                <td class="text-right">${formatRupiah(invoice.total_tax)}</td>
            </tr>
            ${invoice.shipping_cost > 0 ? `
            <tr>
                <td colspan="3">Ongkos Kirim</td>
                <td class="text-right">${formatRupiah(invoice.shipping_cost)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td colspan="3"><strong>TOTAL</strong></td>
                <td class="text-right"><strong>${formatRupiah(invoice.total_amount)}</strong></td>
            </tr>
        </tfoot>
    </table>
    
    <div>
        <strong>Terbilang:</strong> ${taxCalculator.toWords(Number(invoice.total_amount))}
    </div>
    
    <div class="footer">
        <p>Terima kasih atas pembelian Anda</p>
        <p>Dokumen ini adalah invoice resmi dari ${invoice.company_name}</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * Cancel invoice
     */
    async cancelInvoice(invoiceId, reason) {
        return await prisma.invoices.update({
            where: { id: invoiceId },
            data: {
                status: 'CANCELLED',
                cancellation_reason: reason,
                cancelled_at: new Date()
            }
        });
    }

    /**
     * Create replacement invoice
     */
    async replaceInvoice(originalInvoiceId) {
        const original = await prisma.invoices.findUnique({
            where: { id: originalInvoiceId }
        });

        if (!original) throw new Error('Original invoice not found');

        // Cancel original
        await this.cancelInvoice(originalInvoiceId, 'Replaced by new invoice');

        // Create replacement
        const newInvoiceNumber = await this.generateInvoiceNumber();

        const replacement = await prisma.invoices.create({
            data: {
                ...original,
                id: undefined,
                invoice_number: newInvoiceNumber,
                replaces: originalInvoiceId,
                status: 'ACTIVE',
                issued_at: new Date(),
                created_at: new Date()
            }
        });

        // Update original
        await prisma.invoices.update({
            where: { id: originalInvoiceId },
            data: { replaced_by: replacement.id }
        });

        return replacement;
    }
}

export const invoiceGenerator = new InvoiceGenerator();
