/**
 * Quick SMTP credentials test
 */

require('dotenv').config();

console.log('Testing Brevo SMTP Credentials...\n');

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 20)}...` : 'NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM);

console.log('\n---');
console.log('\nChecklist:');
console.log('[ ] SMTP_USER harus email yang digunakan untuk LOGIN ke Brevo');
console.log('[ ] SMTP_PASS harus SMTP API Key (starts with xkeysib- or xsmtpsib-)');
console.log('[ ] SMTP_FROM harus verified di Brevo dashboard');
console.log('\nJika masih error 535:');
console.log('1. Cek SMTP_USER = email LOGIN Brevo (bukan sender email)');
console.log('2. Generate SMTP API Key baru di: https://app.brevo.com/settings/keys/smtp');
console.log('3. Pastikan tidak ada spasi/enter di API key');
