import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Fallback to console.log if Resend not configured
const isDev = process.env.NODE_ENV === 'development';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@infiya.store';

/**
 * Send email using Resend
 * Falls back to console.log in development if Resend not configured
 */
async function sendEmail({ to, subject, html }) {
    if (!resend) {
        if (isDev) {
            console.log('📧 [DEV MODE] Email would be sent:');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('HTML:', html);
            return { success: true, id: 'dev-mode' };
        }
        throw new Error('Resend API key not configured');
    }

    try {
        const data = await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            html,
        });

        console.log('✅ Email sent successfully:', data.id);
        return { success: true, id: data.id };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        throw error;
    }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;

    const subject = 'Verifikasi Email Anda - infiya.store';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">infiya.store</h1>
                    <p style="margin: 10px 0 0;">Selamat Datang! 🎉</p>
                </div>
                <div class="content">
                    <h2>Halo ${user.name},</h2>
                    <p>Terima kasih telah mendaftar di <strong>infiya.store</strong>! Untuk mengaktifkan akun Anda, silakan verifikasi email Anda dengan mengklik tombol di bawah ini:</p>
                    
                    <a href="${verificationUrl}" class="button">Verifikasi Email Saya</a>
                    
                    <p>Atau copy link berikut ke browser Anda:</p>
                    <p style="background: #f8fafc; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
                    
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Link verifikasi ini berlaku selama 24 jam.</p>
                    
                    <p>Jika Anda tidak mendaftar di infiya.store, abaikan email ini.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: user.email, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    const subject = 'Reset Password - infiya.store';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">infiya.store</h1>
                    <p style="margin: 10px 0 0;">Reset Password 🔐</p>
                </div>
                <div class="content">
                    <h2>Halo ${user.name},</h2>
                    <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
                    
                    <a href="${resetUrl}" class="button">Reset Password</a>
                    
                    <p>Atau copy link berikut ke browser Anda:</p>
                    <p style="background: #f8fafc; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 14px;">${resetUrl}</p>
                    
                    <div class="warning">
                        <p style="margin: 0;"><strong>⚠️ Perhatian:</strong> Link ini hanya berlaku selama 1 jam untuk keamanan akun Anda.</p>
                    </div>
                    
                    <p>Jika Anda tidak meminta reset password, abaikan email ini dan password Anda tidak akan berubah.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: user.email, subject, html });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order) {
    const subject = `Pesanan Berhasil #${order.orderNumber} - infiya.store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .order-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">✅ Pesanan Berhasil!</h1>
                    <p style="margin: 10px 0 0;">Terima kasih telah berbelanja</p>
                </div>
                <div class="content">
                    <h2>Halo ${order.user.name},</h2>
                    <p>Pesanan Anda telah kami terima dan sedang diproses!</p>
                    
                    <div class="order-info">
                        <h3 style="margin-top: 0;">Detail Pesanan</h3>
                        <p><strong>Nomor Pesanan:</strong> ${order.orderNumber}</p>
                        <p><strong>Total:</strong> Rp ${order.total.toLocaleString('id-ID')}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                    </div>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" class="button">Lihat Detail Pesanan</a>
                    
                    <p>Kami akan segera memproses pesanan Anda dan mengirimkan update via email.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: order.user.email, subject, html });
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(order) {
    const subject = `Pembayaran Berhasil #${order.orderNumber} - infiya.store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .success-badge { background: #d1fae5; color: #065f46; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: 600; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">💰 Pembayaran Berhasil!</h1>
                    <p style="margin: 10px 0 0;">Pesanan Anda sedang diproses</p>
                </div>
                <div class="content">
                    <h2>Halo ${order.user.name},</h2>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <span class="success-badge">✅ PEMBAYARAN BERHASIL</span>
                    </div>
                    
                    <p>Pembayaran untuk pesanan <strong>#${order.orderNumber}</strong> telah kami terima!</p>
                    
                    <p>Pesanan Anda akan segera kami proses dan kirimkan. Anda akan menerima update pengiriman via email.</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" class="button">Lacak Pesanan</a>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: order.user.email, subject, html });
}

/**
 * Send order cancelled email
 */
export async function sendOrderCancelledEmail(order) {
    const subject = `Pesanan Dibatalkan #${order.orderNumber} - infiya.store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">❌ Pesanan Dibatalkan</h1>
                </div>
                <div class="content">
                    <h2>Halo ${order.user.name},</h2>
                    <p>Pesanan <strong>#${order.orderNumber}</strong> telah dibatalkan karena pembayaran tidak diterima dalam 24 jam.</p>
                    
                    <p>Jika Anda masih tertarik dengan produk ini, silakan buat pesanan baru.</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" class="button">Lihat Produk</a>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: order.user.email, subject, html });
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(order, trackingNumber) {
    const subject = `Pesanan Dikirim #${order.orderNumber} - infiya.store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .tracking-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">📦 Pesanan Dikirim!</h1>
                    <p style="margin: 10px 0 0;">Paket dalam perjalanan</p>
                </div>
                <div class="content">
                    <h2>Halo ${order.user.name},</h2>
                    <p>Kabar baik! Pesanan <strong>#${order.orderNumber}</strong> sudah dikirim!</p>
                    
                    <div class="tracking-box">
                        <p style="margin: 0 0 10px;"><strong>Nomor Resi:</strong></p>
                        <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 0;">${trackingNumber}</p>
                    </div>
                    
                    <p>Anda dapat melacak pengiriman pesanan Anda dengan nomor resi di atas.</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" class="button">Lacak Pesanan</a>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: order.user.email, subject, html });
}

/**
 * Send order delivered email
 */
export async function sendOrderDeliveredEmail(order) {
    const subject = `Pesanan Diterima #${order.orderNumber} - infiya.store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">✅ Pesanan Diterima!</h1>
                    <p style="margin: 10px 0 0;">Terima kasih telah berbelanja</p>
                </div>
                <div class="content">
                    <h2>Halo ${order.user.name},</h2>
                    <p>Pesanan <strong>#${order.orderNumber}</strong> telah sampai di tujuan!</p>
                    
                    <p>Kami harap Anda puas dengan produk kami. Jika ada kendala atau pertanyaan, jangan ragu untuk menghubungi kami.</p>
                    
                    <p><strong>Jangan lupa untuk memberikan review!</strong> Feedback Anda sangat berarti bagi kami dan pembeli lainnya.</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" class="button">Berikan Review</a>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: order.user.email, subject, html });
}

/**
 * Send review request email
 */
export async function sendReviewRequestEmail(order) {
    const subject = `Bagaimana Pengalaman Belanja Anda? - infiya.store`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .stars { font-size: 32px; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">⭐ Beri Kami Review!</h1>
                    <p style="margin: 10px 0 0;">Pendapat Anda sangat berarti</p>
                </div>
                <div class="content">
                    <h2>Halo ${order.user.name},</h2>
                    <p>Terima kasih telah berbelanja di infiya.store!</p>
                    
                    <div class="stars">⭐⭐⭐⭐⭐</div>
                    
                    <p>Bagaimana pengalaman Anda dengan produk <strong>#${order.orderNumber}</strong>?</p>
                    
                    <p>Review Anda akan membantu:</p>
                    <ul>
                        <li>Pembeli lain untuk membuat keputusan</li>
                        <li>Kami untuk meningkatkan layanan</li>
                        <li>Toko untuk tumbuh dan berkembang</li>
                    </ul>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" class="button">Tulis Review Sekarang</a>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: order.user.email, subject, html });
}

/**
 * Send low stock alert to admin
 */
export async function sendLowStockAlert(products) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@infiya.store';
    const subject = `⚠️ Low Stock Alert - ${products.length} Products`;

    const productList = products.map(p => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: ${p.stock <= 5 ? '#ef4444' : '#f59e0b'}; font-weight: bold;">${p.stock}</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
                </div>
                <div class="content">
                    <h2>Admin Notification</h2>
                    <p>The following products have low stock (<= 10 units):</p>
                    
                    <table>
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productList}
                        </tbody>
                    </table>
                    
                    <p><strong>Action required:</strong> Please restock these products to avoid stockouts.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} infiya.store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({ to: adminEmail, subject, html });
}
