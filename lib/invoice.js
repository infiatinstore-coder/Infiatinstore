/**
 * Invoice PDF Generator (FREE - uses browser print)
 * No external library needed!
 */

export function generateInvoiceHTML(order) {
    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(date));
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice ${order.orderNumber}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                padding: 40px; 
                max-width: 800px; 
                margin: 0 auto;
                color: #333;
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #10b981;
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                color: #10b981;
            }
            .logo span { color: #333; }
            .invoice-title { 
                text-align: right;
            }
            .invoice-title h1 { 
                font-size: 32px; 
                color: #333;
                margin-bottom: 5px;
            }
            .invoice-title p { color: #666; }
            .info-section { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px;
            }
            .info-box { flex: 1; }
            .info-box h3 { 
                font-size: 12px; 
                color: #666; 
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .info-box p { 
                color: #333; 
                margin-bottom: 4px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 30px;
            }
            th { 
                background: #f3f4f6; 
                padding: 12px; 
                text-align: left;
                font-size: 12px;
                text-transform: uppercase;
                color: #666;
            }
            td { 
                padding: 12px; 
                border-bottom: 1px solid #e5e7eb;
            }
            .product-name { font-weight: 500; }
            .product-variant { font-size: 12px; color: #666; }
            .text-right { text-align: right; }
            .totals { 
                width: 300px; 
                margin-left: auto;
            }
            .totals-row { 
                display: flex; 
                justify-content: space-between; 
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .totals-row.grand-total { 
                font-size: 18px;
                font-weight: bold;
                color: #10b981;
                border-bottom: 2px solid #10b981;
                padding-top: 12px;
            }
            .footer { 
                margin-top: 40px; 
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            .badge { 
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .badge-paid { background: #dcfce7; color: #166534; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            .notes { 
                background: #f9fafb; 
                padding: 15px; 
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .notes h4 { 
                font-size: 12px; 
                color: #666; 
                margin-bottom: 5px;
            }
            @media print {
                body { padding: 20px; }
                button { display: none !important; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">
                infiya<span>.store</span>
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <p>${order.orderNumber}</p>
                <p>${formatDate(order.created_at)}</p>
            </div>
        </div>

        <div class="info-section">
            <div class="info-box">
                <h3>Dari</h3>
                <p><strong>infiatin.store</strong></p>
                <p>Email: support@infiatin.store</p>
                <p>WhatsApp: 08xx-xxxx-xxxx</p>
            </div>
            <div class="info-box">
                <h3>Kepada</h3>
                <p><strong>${order.address?.recipientName || order.user?.name}</strong></p>
                <p>${order.address?.phone || ''}</p>
                <p>${order.address?.street || ''}</p>
                <p>${order.address?.district || ''}, ${order.address?.cityName || ''}</p>
                <p>${order.address?.provinceName || ''} ${order.address?.postalCode || ''}</p>
            </div>
            <div class="info-box text-right">
                <h3>Status</h3>
                <span class="badge ${order.status === 'PAID' || order.status === 'COMPLETED' ? 'badge-paid' : 'badge-pending'}">
                    ${order.status === 'PAID' ? 'LUNAS' : order.status === 'COMPLETED' ? 'SELESAI' : 'PENDING'}
                </span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Produk</th>
                    <th class="text-right">Harga</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items?.map(item => `
                    <tr>
                        <td>
                            <div class="product-name">${item.product?.name || item.productName}</div>
                            ${item.variant ? `<div class="product-variant">${item.variant.name}</div>` : ''}
                        </td>
                        <td class="text-right">${formatRupiah(item.price)}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatRupiah(item.price * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>Subtotal</span>
                <span>${formatRupiah(order.subtotal)}</span>
            </div>
            <div class="totals-row">
                <span>Ongkos Kirim</span>
                <span>${formatRupiah(order.shipping_cost || 0)}</span>
            </div>
            ${order.discount > 0 ? `
                <div class="totals-row">
                    <span>Diskon</span>
                    <span>-${formatRupiah(order.discount)}</span>
                </div>
            ` : ''}
            ${order.pointsUsed > 0 ? `
                <div class="totals-row">
                    <span>Poin Digunakan</span>
                    <span>-${formatRupiah(order.pointsUsed * 100)}</span>
                </div>
            ` : ''}
            <div class="totals-row grand-total">
                <span>TOTAL</span>
                <span>${formatRupiah(order.total_amount)}</span>
            </div>
        </div>

        ${order.shippingMethod ? `
            <div class="notes">
                <h4>Pengiriman</h4>
                <p>${order.shippingMethod.courier?.toUpperCase() || ''} - ${order.shippingMethod.service || ''}</p>
                ${order.tracking_number ? `<p>No. Resi: <strong>${order.tracking_number}</strong></p>` : ''}
            </div>
        ` : ''}

        ${order.notes ? `
            <div class="notes">
                <h4>Catatan</h4>
                <p>${order.notes}</p>
            </div>
        ` : ''}

        <div class="footer">
            <p>Terima kasih telah berbelanja di infiatin.store</p>
            <p style="margin-top: 5px;">Invoice ini sah sebagai bukti transaksi dan pembayaran</p>
            <p style="margin-top: 15px; color: #999;">© 2024 infiatin.store - Semua Hak Dilindungi</p>
        </div>

        <script>
            // Auto print when opened
            window.onload = function() {
                setTimeout(() => window.print(), 500);
            }
        </script>
    </body>
    </html>
    `;
}

/**
 * Open invoice in new window for printing
 */
export function printInvoice(order) {
    const invoiceHTML = generateInvoiceHTML(order);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
}

/**
 * Download invoice as HTML (can be opened in browser)
 */
export function downloadInvoice(order) {
    const invoiceHTML = generateInvoiceHTML(order);
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
