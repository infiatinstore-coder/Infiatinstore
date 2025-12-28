# 🔐 Midtrans Sandbox Setup Guide

**Tujuan:** Mendapatkan API keys untuk testing payment integration

**Estimasi Waktu:** 10-15 menit

---

## Step 1: Register Akun Sandbox

1. **Buka** https://dashboard.sandbox.midtrans.com/register
2. **Isi form registrasi:**
   - Email
   - Password (min 8 karakter)
   - Phone number
3. **Centang** "I agree to Terms and Conditions"
4. **Klik** "Register"
5. **Cek email** untuk verification link
6. **Klik** link verification di email

---

## Step 2: Login ke Dashboard

1. **Buka** https://dashboard.sandbox.midtrans.com/
2. **Login** dengan email & password Anda
3. Anda akan masuk ke dashboard sandbox

---

## Step 3: Dapatkan API Keys

1. **Navigate** ke **Settings** → **Access Keys** di sidebar
2. **Copy** kedua keys:
   - **Server Key** (dimulai dengan `SB-Mid-server-...`)
   - **Client Key** (dimulai dengan `SB-Mid-client-...`)

---

## Step 4: Tambahkan ke .env

1. **Buka** file `.env` di root project (buat jika belum ada)
2. **Paste** keys yang sudah di-copy:

```env
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxxxx"
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxxxx"
MIDTRANS_IS_PRODUCTION="false"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxxxx"
```

3. **Save** file

---

## Step 5: Test Connection

**Test dengan curl:**

```bash
curl -X POST https://api.sandbox.midtrans.com/v2/charge \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Basic $(echo -n 'YOUR_SERVER_KEY:' | base64)" \\
  -d '{
    "payment_type": "bank_transfer",
    "transaction_details": {
      "order_id": "TEST-ORDER-001",
      "gross_amount": 100000
    },
    "bank_transfer": {
      "bank": "bca"
    }
  }'
```

**Expected response:** JSON dengan `transaction_id` dan `va_numbers`

---

## 🧪 Test Cards & Accounts

### Credit Card (Sandbox)
```
Success:
- Card: 4811 1111 1111 1114
- CVV: 123
- Expiry: 01/25
- 3DS: 112233

Challenge (perlu OTP):
- Card: 4411 1111 1111 1118

Denied:
- Card: 4511 1111 1111 1117
```

### GoPay
- Phone: 081234567890
- PIN: 123456

### ShopeePay / QRIS
- Scan QR code dari sandbox
- Auto approve setelah 10 detik

---

## 📋 Webhook Configuration (Opsional)

Jika ingin test webhook di local:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy** HTTPS URL dari ngrok (e.g., `https://abc123.ngrok.io`)

4. **Set webhook di Midtrans:**
   - Settings → Configuration
   - Payment Notification URL: `https://abc123.ngrok.io/api/payment/webhook`
   - Click "Update"

5. **Test:** Setiap payment akan trigger webhook ke local server

---

## ✅ Verification Checklist

- [ ] Akun sandbox berhasil dibuat
- [ ] Email terverifikasi
- [ ] Server Key & Client Key sudah di-copy
- [ ] Keys sudah ditambahkan ke `.env`
- [ ] Test connection berhasil (opsional)

---

## 🚨 Troubleshooting

**Problem:** Email verification tidak masuk
- **Solution:** Cek spam folder, atau request ulang verification

**Problem:** API key tidak muncul
- **Solution:** Refresh halaman, atau logout & login ulang

**Problem:** Test API gagal dengan 401 Unauthorized
- **Solution:** Pastikan Server Key correct dan format: `Authorization: Basic base64(SERVER_KEY:)`

---

## 📝 Next Steps

Setelah setup selesai:
1. ✅ Restart development server (`npm run dev`)
2. ✅ Test payment creation di aplikasi
3. ✅ Verify webhook callback

---

**Documentation:** https://docs.midtrans.com/  
**Support:** support@midtrans.com
