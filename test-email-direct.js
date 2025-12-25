/**
 * DIRECT SMTP TEST - Standalone Script
 * 
 * Script ini test SMTP tanpa Next.js
 * Run dengan: node test-email-direct.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Debug: Check if nodemailer loaded correctly
if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
    console.error('❌ Nodemailer import failed!');
    console.error('nodemailer object:', nodemailer);
    process.exit(1);
}

async function sendTestEmail() {
    console.log('============================================');
    console.log('  TESTING SMTP - Direct Node.js');
    console.log('============================================\n');

    // Check env vars
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('❌ SMTP credentials not found in .env');
        console.log('   Run: powershell -ExecutionPolicy Bypass -File setup-smtp.ps1');
        process.exit(1);
    }

    console.log('SMTP Config:');
    console.log(`  Host: ${process.env.SMTP_HOST}`);
    console.log(`  Port: ${process.env.SMTP_PORT}`);
    console.log(`  Secure: ${process.env.SMTP_SECURE}`);
    console.log(`  User: ${process.env.SMTP_USER}`);
    console.log(`  From: ${process.env.SMTP_FROM || process.env.SMTP_USER}\n`);

    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: (process.env.SMTP_SECURE === 'true'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    console.log('✅ Transporter created\n');

    console.log('Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified\n');
    } catch (error) {
        console.log('❌ SMTP connection failed:');
        console.log(`   ${error.message}\n`);
        process.exit(1);
    }

    const testEmail = process.env.SMTP_USER;
    console.log(`Sending test email to: ${testEmail}...`);

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: testEmail,
        subject: '🎉 SMTP Test - Infiyatin Store',
        text: `Halo!

Ini adalah test email dari Infiyatin Store.

Jika Anda menerima email ini, berarti konfigurasi SMTP sudah bekerja dengan baik!

✅ SMTP Configuration: SUCCESS
📧 Email Service: Ready

Terima kasih,
Infiyatin Store Team

---
Email ini dikirim secara otomatis untuk testing purposes.
Waktu kirim: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
        html: `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMTP Test Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .success-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin: 20px 0;
        }
        .details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .details h3 {
            margin-top: 0;
            color: #667eea;
        }
        .details ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .details li {
            margin: 8px 0;
        }
        .footer {
            background: #1f2937;
            color: #9ca3af;
            padding: 20px;
            text-align: center;
            font-size: 14px;
        }
        .footer a {
            color: #60a5fa;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 SMTP Test Berhasil!</h1>
            <p>Infiyatin Store - Email Service</p>
        </div>
        <div class="content">
            <div class="success-badge">✅ Configuration: SUCCESS</div>
            
            <p>Halo!</p>
            <p>Selamat! Ini adalah test email dari <strong>Infiyatin Store</strong>.</p>
            <p>Jika Anda menerima email ini, berarti konfigurasi SMTP sudah bekerja dengan sempurna! 🎊</p>
            
            <div class="details">
                <h3>📊 Detail Konfigurasi:</h3>
                <ul>
                    <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
                    <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
                    <li><strong>Secure:</strong> ${process.env.SMTP_SECURE !== 'false' ? 'Yes (SSL/TLS)' : 'No'}</li>
                    <li><strong>From:</strong> ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
                    <li><strong>Waktu Kirim:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</li>
                </ul>
            </div>
            
            <p>Sistem email sekarang siap digunakan untuk:</p>
            <ul>
                <li>Email order confirmation</li>
                <li>Email notifikasi pengiriman</li>
                <li>Email promo & newsletter</li>
            </ul>
            
            <p>Terima kasih,<br>
            <strong>Infiyatin Store Team</strong></p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis untuk testing purposes.</p>
            <p>© 2025 Infiyatin Store. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `,
    };

    try {
        const result = await transporter.sendMail(mailOptions);

        console.log('\n============================================');
        console.log('  ✅ EMAIL BERHASIL DIKIRIM!');
        console.log('============================================\n');
        console.log(`Message ID: ${result.messageId}`);
        console.log(`To: ${testEmail}`);
        console.log(`\nCek inbox Anda: ${testEmail}\n`);
        console.log('============================================\n');

    } catch (error) {
        console.log('\n============================================');
        console.log('  ❌ GAGAL MENGIRIM EMAIL');
        console.log('============================================\n');
        console.log(`Error: ${error.message}`);
        console.log(`\nDetail: ${error.stack}\n`);
        console.log('====================');
        process.exit(1);
    }
}

// Run
sendTestEmail()
    .then(() => {
        console.log('✅ Test selesai!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test gagal:', error);
        process.exit(1);
    });
