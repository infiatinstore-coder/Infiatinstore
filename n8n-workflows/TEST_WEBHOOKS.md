# 🧪 Test n8n Webhooks - Infiatin Store

**Quick test script untuk semua WhatsApp notifications**

---

## 📋 Test Commands

Ganti `6281234567890` dengan nomor WhatsApp Anda!

### 1. Test OTP Verification
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/otp-verification \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "6281234567890",
    "otp": "123456"
  }'
```

### 2. Test Order Created
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890",
    "total": "Rp 500,000",
    "itemsCount": 3
  }'
```

### 3. Test Payment Success
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/payment-success \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890",
    "total": "Rp 500,000"
  }'
```

### 4. Test Order Shipped
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/order-shipped \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890",
    "courier": "JNE",
    "trackingNumber": "JP1234567890"
  }'
```

### 5. Test Order Completed
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/order-completed \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890"
  }'
```

### 6. Test Order Cancelled
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/order-cancelled \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890",
    "reason": "Out of stock"
  }'
```

### 7. Test Payment Expired
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/payment-expired \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890",
    "total": "Rp 500,000"
  }'
```

### 8. Test Refund Requested (Admin)
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/refund-requested \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "adminPhone": "6281234567890",
    "amount": "Rp 500,000",
    "reason": "Product defect"
  }'
```

### 9. Test Security Alert (Admin)
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/security-alert \
  -H "Content-Type: application/json" \
  -d '{
    "adminPhone": "6281234567890",
    "alertType": "Suspicious Login",
    "ipAddress": "192.168.1.1",
    "userId": "user-123",
    "details": "Multiple failed login attempts",
    "timestamp": "2025-12-29 02:00:00"
  }'
```

### 10. Test Error Spike (Admin)
```bash
curl -X POST https://infiatinstore.app.n8n.cloud/webhook/error-spike \
  -H "Content-Type: application/json" \
  -d '{
    "adminPhone": "6281234567890",
    "errorCount": 50,
    "timeWindow": "5 minutes",
    "errorType": "Database Connection",
    "endpoint": "/api/orders",
    "timestamp": "2025-12-29 02:00:00"
  }'
```

---

## 🔍 Check Results

### 1. WhatsApp
Check WhatsApp di nomor yang Anda test - harus terima message!

### 2. n8n Dashboard
https://infiatinstore.app.n8n.cloud → Executions tab

Should see:
- ✅ Success status
- Green checkmarks
- Execution details

### 3. WAHA Logs
Check WAHA dashboard atau logs untuk confirm message sent.

---

## ⚠️ Troubleshooting

### Test Failed?

**Check:**
1. Workflow ACTIVE di n8n? (toggle switch ON)
2. WAHA running? `curl https://waha.infiya.store/api/sessions`
3. WhatsApp session connected?
4. Phone format benar? (628xxx tanpa +)

### No WhatsApp Message?

**Check:**
1. n8n Execution tab - ada error?
2. WAHA API accessible dari n8n Cloud?
3. API Key benar?
4. Phone number format: `628xxx@c.us`

---

## 📊 Expected Messages

### Customer Notifications
1. **OTP:** "🔐 *Kode Verifikasi* ..."
2. **Order Created:** "🎉 *PESANAN BARU* ..."
3. **Payment Success:** "✅ *PEMBAYARAN BERHASIL* ..."
4. **Order Shipped:** "📦 *PESANAN DIKIRIM* ..."
5. **Order Completed:** "✅ *PESANAN SELESAI* ..."
6. **Order Cancelled:** "❌ *PESANAN DIBATALKAN* ..."
7. **Payment Expired:** "⏰ *PEMBAYARAN KEDALUWARSA* ..."

### Admin Notifications
8. **Refund Requested:** "🔄 *PERMINTAAN REFUND* ..."
9. **Security Alert:** "🚨 *SECURITY ALERT* ..."
10. **Error Spike:** "🔥 *ERROR SPIKE DETECTED* ..."

---

## 🚀 Next Step

Setelah test berhasil:
1. Copy `.env.template` content
2. Paste ke `.env` project Anda
3. Commit & push
4. Update Vercel environment variables
5. Production ready! 🎉

---

**Happy Testing!** 🧪
