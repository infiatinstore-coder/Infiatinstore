#!/usr/bin/env node

/**
 * Environment Variables Setup Helper
 * Helps generate required values for .env file
 */

const crypto = require('crypto');

console.log('🔧 Infiatin Store - Environment Setup Helper\n');
console.log('='.repeat(60));

// 1. Generate JWT Secret
console.log('\n📝 JWT_SECRET (WAJIB):');
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`JWT_SECRET="${jwtSecret}"`);

// 2. Database URL
console.log('\n🗄️ DATABASE_URL (WAJIB):');
console.log('DATABASE_URL="postgresql://postgres:password@localhost:5432/infiyastore"');
console.log('👉 Ganti "password" dengan password PostgreSQL Anda');

// 3. App URL
console.log('\n🌐 NEXT_PUBLIC_APP_URL (WAJIB):');
console.log('NEXT_PUBLIC_APP_URL="http://localhost:3000"');
console.log('👉 Untuk production: ganti dengan domain Anda');

// 4. Midtrans
console.log('\n💳 MIDTRANS (WAJIB untuk checkout):');
console.log('Daftar di: https://dashboard.sandbox.midtrans.com/');
console.log('MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"');
console.log('MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxx"');
console.log('MIDTRANS_IS_PRODUCTION="false"');
console.log('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="<sama dengan MIDTRANS_CLIENT_KEY>"');
console.log('NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION="false"');

// 5. SMTP (Brevo)
console.log('\n📧 SMTP (WAJIB untuk email):');
console.log('Daftar di: https://app.brevo.com/settings/keys/smtp');
console.log('SMTP_HOST="smtp-relay.brevo.com"');
console.log('SMTP_PORT="587"');
console.log('SMTP_SECURE="false"');
console.log('SMTP_USER="<email-login-brevo-anda@example.com>"');
console.log('SMTP_PASS="<brevo-smtp-api-key>"');
console.log('SMTP_FROM="<email-terverifikasi@yourdomain.com>"');

// 6. Admin Emails
console.log('\n👨‍💼 ADMIN EMAILS:');
console.log('ADMIN_EMAIL="admin@infiatin.store"');
console.log('ALERT_EMAIL="admin@infiatin.store"');
console.log('👉 Ganti dengan email admin yang sebenarnya');

// 7. Optional APIs
console.log('\n🟠 OPTIONAL (bisa dikosongkan):');
console.log('RAJAONGKIR_API_KEY="" # Cek ongkir dari rajaongkir.com');
console.log('N8N_WEBHOOK_ORDER_CREATED="" # WhatsApp notifikasi');
console.log('GEMINI_API_KEY="" # AI features dari aistudio.google.com');

console.log('\n' + '='.repeat(60));
console.log('✅ Copy paste nilai di atas ke file .env Anda!');
console.log('⚠️ JANGAN commit file .env ke git!');
console.log('='.repeat(60) + '\n');
