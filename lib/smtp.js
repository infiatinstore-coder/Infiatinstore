import nodemailer from 'nodemailer';

// Create SMTP transporter
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    transporter = nodemailer.createTransporter(smtpConfig);
    return transporter;
}

/**
 * Send email via SMTP (Brevo/other providers)
 */
export async function sendEmailSMTP({ to, subject, html, from }) {
    try {
        const smtp = getTransporter();

        const mailOptions = {
            from: from || process.env.SMTP_FROM || 'noreply@infiatin.store',
            to,
            subject,
            html
        };

        const info = await smtp.sendMail(mailOptions);

        console.log('✅ SMTP Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ SMTP Email sending failed:', error);
        throw error;
    }
}

/**
 * Send order confirmation email via SMTP
 */
export async function sendOrderConfirmationSMTP(order) {
    // Get recipient email (either from order.user for authenticated or guestEmail for guest)
    const recipientEmail = order.user?.email || order.guestEmail;
    const recipientName = order.user?.name || order.guestName;

    if (!recipientEmail) {
        console.warn('⚠️ No email address found for order:', order.orderNumber);
        return { success: false, error: 'No email address' };
    }

    const subject = `Pesanan Berhasil #${order.orderNumber} - Infiatin Store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .order-info { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; padding: 20px; }
                .price { font-size: 24px; font-weight: bold; color: #10b981; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Pesanan Berhasil Dibuat!</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Terima kasih telah berbelanja</p>
                </div>
                <div class="content">
                    <h2 style="color: #1f2937; margin-top: 0;">Halo ${recipientName},</h2>
                    <p style="color: #4b5563; line-height: 1.6;">Pesanan Anda telah kami terima dan sedang menunggu pembayaran!</p>
                    
                    <div class="order-info">
                        <h3 style="margin-top: 0; color: #065f46;">📦 Detail Pesanan</h3>
                        <p style="margin: 8px 0;"><strong>Nomor Pesanan:</strong> <span style="color: #10b981;">${order.orderNumber}</span></p>
                        <p style="margin: 8px 0;"><strong>Total Pembayaran:</strong> <span class="price">Rp ${order.total.toLocaleString('id-ID')}</span></p>
                        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 14px;">Menunggu Pembayaran</span></p>
                        <p style="margin: 8px 0; color: #64748b; font-size: 14px;">⏰ Silakan selesaikan pembayaran dalam 24 jam</p>
                    </div>
                    
                    <p style="color: #4b5563; line-height: 1.6;"><strong>Langkah selanjutnya:</strong></p>
                    <ol style="color: #4b5563; line-height: 1.8;">
                        <li>Klik tombol di bawah untuk melanjutkan pembayaran</li>
                        <li>Pilih metode pembayaran yang Anda inginkan</li>
                        <li>Selesaikan pembayaran sesuai instruksi</li>
                        <li>Pesanan akan segera diproses setelah pembayaran dikonfirmasi</li>
                    </ol>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}" class="button">Bayar Sekarang →</a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        💡 <strong>Tips:</strong> Simpan nomor pesanan Anda untuk melacak status pengiriman.
                    </p>
                </div>
                <div class="footer">
                    <p style="margin: 0;">Butuh bantuan? Hubungi kami di <a href="https://wa.me/6281234567890" style="color: #10b981;">WhatsApp</a></p>
                    <p style="margin: 10px 0 0; color: #94a3b8;">© ${new Date().getFullYear()} Infiatin Store. Oleh-Oleh Haji & Umroh Terpercaya.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmailSMTP({ to: recipientEmail, subject, html });
}

/**
 * Send order shipped notification via SMTP
 */
export async function sendOrderShippedSMTP(order, trackingNumber, courierName) {
    const recipientEmail = order.user?.email || order.guestEmail;
    const recipientName = order.user?.name || order.guestName;

    if (!recipientEmail) {
        console.warn('⚠️ No email address found for order:', order.orderNumber);
        return { success: false, error: 'No email address' };
    }

    const subject = `📦 Pesanan Dikirim #${order.orderNumber} - Infiatin Store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .tracking-box { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #3b82f6; }
                .resi { font-size: 28px; font-weight: bold; color: #1d4ed8; letter-spacing: 2px; margin: 10px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">📦 Pesanan Dikirim!</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Paket dalam perjalanan ke alamat Anda</p>
                </div>
                <div class="content">
                    <h2 style="color: #1f2937; margin-top: 0;">Halo ${recipientName},</h2>
                    <p style="color: #4b5563; line-height: 1.6;">Kabar baik! Pesanan <strong>#${order.orderNumber}</strong> sudah dikirim oleh kurir <strong>${courierName || 'JNE'}</strong>!</p>
                    
                    <div class="tracking-box">
                        <p style="margin: 0 0 10px; color: #1e40af; font-weight: 600;">📍 NOMOR RESI PENGIRIMAN</p>
                        <div class="resi">${trackingNumber}</div>
                        <p style="margin: 10px 0 0; color: #64748b; font-size: 14px;">Gunakan nomor ini untuk melacak paket Anda</p>
                    </div>
                    
                    <p style="color: #4b5563; line-height: 1.6;"><strong>Cara melacak paket:</strong></p>
                    <ol style="color: #4b5563; line-height: 1.8;">
                        <li>Salin nomor resi di atas</li>
                        <li>Kunjungi website ${courierName || 'kurir'}</li>
                        <li>Masukkan nomor resi untuk melihat posisi paket</li>
                        <li>Atau klik tombol di bawah untuk tracking otomatis</li>
                    </ol>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}" style="display: inline-block; padding: 15px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                            Lacak Paket →
                        </a>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                        <p style="margin: 0; color: #78350f;"><strong>⏰ Estimasi Pengiriman:</strong> 2-4 hari kerja (tergantung lokasi)</p>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                        Terima kasih telah berbelanja di Infiatin Store! 🙏
                    </p>
                </div>
                <div class="footer">
                    <p style="margin: 0;">Butuh bantuan? Hubungi kami di <a href="https://wa.me/6281234567890" style="color: #3b82f6;">WhatsApp</a></p>
                    <p style="margin: 10px 0 0; color: #94a3b8;">© ${new Date().getFullYear()} Infiatin Store. Oleh-Oleh Haji & Umroh Terpercaya.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmailSMTP({ to: recipientEmail, subject, html });
}
