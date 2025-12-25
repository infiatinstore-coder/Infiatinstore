// Test Environment Variables
// Run: node scripts/test-env.js

console.log('🔍 Testing Environment Variables...\n');

const required = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'JWT_SECRET': process.env.JWT_SECRET,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'MIDTRANS_CLIENT_KEY': process.env.MIDTRANS_CLIENT_KEY,
    'MIDTRANS_IS_PRODUCTION': process.env.MIDTRANS_IS_PRODUCTION,
    'NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION': process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION,
    'SMTP_HOST': process.env.SMTP_HOST,
    'SMTP_USER': process.env.SMTP_USER,
    'RAJAONGKIR_API_KEY': process.env.RAJAONGKIR_API_KEY,
    'RAJAONGKIR_ACCOUNT_TYPE': process.env.RAJAONGKIR_ACCOUNT_TYPE,
    'ADMIN_EMAIL': process.env.ADMIN_EMAIL,
};

let allGood = true;

for (const [key, value] of Object.entries(required)) {
    const status = value ? '✅' : '❌';
    const display = value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : 'NOT SET';
    console.log(`${status} ${key}: ${display}`);

    if (!value) allGood = false;
}

console.log('\n' + '='.repeat(60));
if (allGood) {
    console.log('✅ ALL REQUIRED VARIABLES ARE SET!');
    console.log('🚀 You can now restart the dev server: npm run dev');
} else {
    console.log('❌ SOME VARIABLES ARE MISSING!');
    console.log('⚠️ Check your .env file');
}
console.log('='.repeat(60));
