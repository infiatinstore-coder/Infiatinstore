// TEST API CONFIGURATION
// Run dengan: node test-api-config.js

require('dotenv').config();

console.log('==================================================');
console.log('  TESTING API CONFIGURATION');
console.log('==================================================\n');

// Test RajaOngkir
console.log('🚚 RAJAONGKIR:');
console.log('  API Key:', process.env.RAJAONGKIR_API_KEY ? '✅ Set (' + process.env.RAJAONGKIR_API_KEY.substring(0, 10) + '...)' : '❌ Not set');
console.log('  Account Type:', process.env.RAJAONGKIR_ACCOUNT_TYPE || 'starter');

console.log('\n💳 MIDTRANS:');
console.log('  Merchant ID:', process.env.MIDTRANS_MERCHANT_ID ? '✅ Set' : '❌ Not set');
console.log('  Client Key:', process.env.MIDTRANS_CLIENT_KEY ? '✅ Set (' + process.env.MIDTRANS_CLIENT_KEY.substring(0, 15) + '...)' : '❌ Not set');
console.log('  Server Key:', process.env.MIDTRANS_SERVER_KEY ? '✅ Set (' + process.env.MIDTRANS_SERVER_KEY.substring(0, 15) + '...)' : '❌ Not set');
console.log('  Is Production:', process.env.MIDTRANS_IS_PRODUCTION === 'false' ? '✅ SANDBOX' : '⚠️ PRODUCTION');
console.log('  Public Client Key:', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ? '✅ Set' : '❌ Not set');

console.log('\n==================================================');

// Test RajaOngkir API
console.log('\n🧪 Testing RajaOngkir API...\n');

fetch('https://api.rajaongkir.com/starter/province', {
    method: 'GET',
    headers: {
        'key': process.env.RAJAONGKIR_API_KEY
    }
})
    .then(res => res.json())
    .then(data => {
        if (data.rajaongkir.status.code === 200) {
            console.log('✅ RajaOngkir API: WORKING');
            console.log('   Status:', data.rajaongkir.status.description);
            console.log('   Provinces:', data.rajaongkir.results.length, 'provinces loaded');
        } else {
            console.log('❌ RajaOngkir API: FAILED');
            console.log('   Status:', data.rajaongkir.status.description);
        }
    })
    .catch(err => {
        console.log('❌ RajaOngkir API: ERROR');
        console.log('   Error:', err.message);
    })
    .finally(() => {
        console.log('\n==================================================');
        console.log('  TEST COMPLETED');
        console.log('==================================================\n');
        console.log('Next Steps:');
        console.log('  1. npm run dev');
        console.log('  2. Test checkout flow');
        console.log('  3. Test payment gateway\n');
    });
