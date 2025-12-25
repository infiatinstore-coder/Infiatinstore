/**
 * SMTP MAILER UTILITY - TEST ONLY
 * 
 * ⚠️ PENTING:
 * - File ini HANYA untuk TEST kirim email
 * - TIDAK digunakan untuk auth/verification flow
 * - JANGAN commit credential ke git
 * - Credential ada di .env (sudah gitignored)
 */

const nodemailer = require('nodemailer');

/**
 * Create SMTP transporter
 * Config diambil dari environment variables
 */
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: (process.env.SMTP_SECURE === 'true'), // true for SSL, false for STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

/**
 * Send test email
 * 
 * @param {string} toEmail - Email tujuan
 * @returns {Promise<object>} - Result dari nodemailer
 * @throws {Error} - Jika gagal kirim email
 */
async function sendTestEmail(toEmail) {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: 'SMTP Test - Infiyatin Store',
        text: `Halo!

Ini adalah test email dari Infiyatin Store.

Jika Anda menerima email ini, berarti konfigurasi SMTP sudah bekerja dengan baik.

Terima kasih,
Infiyatin Store Team

---
Email ini dikirim secara otomatis untuk testing purposes.
Waktu kirim: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }
        .success { color: #4CAF50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 SMTP Test Email</h1>
        </div>
        <div class="content">
            <h2 class="success">✅ Konfigurasi SMTP Berhasil!</h2>
            <p>Halo!</p>
            <p>Ini adalah test email dari <strong>Infiyatin Store</strong>.</p>
            <p>Jika Anda menerima email ini, berarti konfigurasi SMTP sudah bekerja dengan baik.</p>
            <br>
            <p><strong>Detail:</strong></p>
            <ul>
                <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                <li>Dari: ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
                <li>Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</li>
            </ul>
            <br>
            <p>Terima kasih,<br><strong>Infiyatin Store Team</strong></p>
        </div>
        <div class="footer">
            Email ini dikirim secara otomatis untuk testing purposes.
        </div>
    </div>
</body>
</html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email berhasil dikirim:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Gagal mengirim email:', error.message);
        throw error;
    }
}

/**
 * Verify SMTP connection
 * Test koneksi ke SMTP server tanpa kirim email
 * 
 * @returns {Promise<boolean>}
 */
async function verifySmtpConnection() {
    const transporter = createTransporter();

    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
        return true;
    } catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        return false;
    }
}

module.exports = {
    sendTestEmail,
    verifySmtpConnection,
};
