# 🚀 Quick Setup - n8n Cloud + WAHA

**Setup cepat untuk Infiatin Store WhatsApp Notifications**

---

## ✅ Prerequisites (Harus Sudah Siap)

- ✅ WAHA running di: `https://waha.infiya.store`
- ✅ WhatsApp session connected & status WORKING
- ✅ n8n.io Cloud account (trial 14 hari)
- ✅ Akses ke 10 workflow files di folder ini

---

## 📋 Setup Steps (15 Menit)

### **1. Login n8n.io Cloud**

```
https://app.n8n.cloud/
```

Login dengan account Anda.

---

### **2. Import 10 Workflows**

**Untuk setiap file** di folder ini (10x):

#### **File List:**
1. `WA_OTP_VERIFICATION.json`
2. `WA_ORDER_CREATED.json`
3. `WA_PAYMENT_SUCCESS.json`
4. `WA_ORDER_SHIPPED.json`
5. `WA_ORDER_COMPLETED.json`
6. `WA_ORDER_CANCELLED.json`
7. `WA_PAYMENT_EXPIRED.json`
8. `WA_REFUND_REQUESTED.json`
9. `WA_SECURITY_ALERT.json`
10. `WA_ERROR_SPIKE.json`

#### **Import Process:**

1. Klik **"+ New Workflow"**
2. Klik **menu "..."** (kanan atas)
3. Pilih **"Import from File"**
4. Upload file JSON
5. Workflow akan terbuka

#### **Setup Credentials (Cukup 1x):**

Saat pertama kali import, buat credential:

1. Klik node **"Send WA ..."** (yang warna biru)
2. Di bagian **"Credential to connect with"** → **"Create New"**
3. Pilih **"Header Auth"**
4. Isi:
   - **Credential Name:** `WAHA API Key`
   - **Name:** `X-Api-Key`
   - **Value:** `infiatin-store-2025DEC-9K7XQ2M8L4A6`
5. **Save**

**PENTING:** Untuk workflow ke-2 sampai ke-10, gunakan credential yang sama (pilih "WAHA API Key" yang sudah dibuat).

#### **Activate Workflow:**

1. Toggle **"Active"** switch (kanan atas) → ON
2. **Save** workflow

#### **Copy Webhook URL:**

1. Klik node **"Webhook ..."** (yang pertama)
2. Copy **"Production URL"**
3. Simpan di notepad (untuk step 3)

**Contoh URL:**
```
https://yourinstance.app.n8n.cloud/webhook/order-created
```

**Repeat untuk semua 10 workflows!**

---

### **3. Update .env di Project**

Di file `.env` Anda (yang sedang terbuka), update webhook URLs:

```env
# ==============================================
# WHATSAPP NOTIFICATIONS (n8n Cloud + WAHA)
# ==============================================

# GANTI dengan webhook URL dari n8n Cloud Anda!
N8N_WEBHOOK_OTP="https://yourinstance.app.n8n.cloud/webhook/otp-verification"
N8N_WEBHOOK_ORDER_CREATED="https://yourinstance.app.n8n.cloud/webhook/order-created"
N8N_WEBHOOK_ORDER_SHIPPED="https://yourinstance.app.n8n.cloud/webhook/order-shipped"
N8N_WEBHOOK_ORDER_COMPLETED="https://yourinstance.app.n8n.cloud/webhook/order-completed"
N8N_WEBHOOK_ORDER_CANCELLED="https://yourinstance.app.n8n.cloud/webhook/order-cancelled"
N8N_WEBHOOK_PAYMENT_SUCCESS="https://yourinstance.app.n8n.cloud/webhook/payment-success"
N8N_WEBHOOK_PAYMENT_EXPIRED="https://yourinstance.app.n8n.cloud/webhook/payment-expired"
N8N_WEBHOOK_REFUND_REQUESTED="https://yourinstance.app.n8n.cloud/webhook/refund-requested"
N8N_WEBHOOK_SECURITY_ALERT="https://yourinstance.app.n8n.cloud/webhook/security-alert"
N8N_WEBHOOK_ERROR_SPIKE="https://yourinstance.app.n8n.cloud/webhook/error-spike"

# API Key sudah di-set di n8n credentials
WHATSAPP_API_KEY="infiatin-store-2025DEC-9K7XQ2M8L4A6"
```

**Save file `.env`**

---

### **4. Test Notifications**

Test dengan curl atau Postman:

```bash
# Test Order Created
curl -X POST https://yourinstance.app.n8n.cloud/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "customerName": "Test User",
    "phone": "6281234567890",
    "total": "Rp 500,000",
    "itemsCount": 3
  }'
```

**Ganti `yourinstance` dengan instance n8n Anda!**
**Ganti `6281234567890` dengan nomor WhatsApp Anda!**

Jika berhasil, Anda akan terima WhatsApp message! 🎉

---

### **5. Deploy ke Vercel**

1. **Update Vercel Environment Variables:**
   - Dashboard Vercel → Settings → Environment Variables
   - Add semua `N8N_WEBHOOK_*` URLs
   - Save

2. **Redeploy:**
   ```bash
   git add .
   git commit -m "feat: add n8n cloud webhooks"
   git push
   ```

3. **Test dari Production:**
   - Buat order di production app
   - Check WhatsApp notification

---

## 🎯 Checklist

**Before Setup:**
- [ ] WAHA accessible: `https://waha.infiya.store`
- [ ] WhatsApp connected (check session status)
- [ ] n8n.io account created

**During Setup:**
- [ ] 10 workflows imported
- [ ] WAHA API Key credential created (1x)
- [ ] All workflows using same credential
- [ ] All workflows activated
- [ ] All webhook URLs copied

**After Setup:**
- [ ] `.env` updated with webhook URLs
- [ ] Test notifications locally
- [ ] Vercel env vars updated
- [ ] Deployed to production
- [ ] Test from production app

---

## 🧪 Test Payloads

### OTP Verification
```json
{
  "phone": "6281234567890",
  "otp": "123456"
}
```

### Order Created
```json
{
  "orderNumber": "INV-TEST-001",
  "customerName": "Test User",
  "phone": "6281234567890",
  "total": "Rp 500,000",
  "itemsCount": 3
}
```

### Payment Success
```json
{
  "orderNumber": "INV-TEST-001",
  "customerName": "Test User",
  "phone": "6281234567890",
  "total": "Rp 500,000"
}
```

### Order Shipped
```json
{
  "orderNumber": "INV-TEST-001",
  "customerName": "Test User",
  "phone": "6281234567890",
  "courier": "JNE",
  "trackingNumber": "JP1234567890"
}
```

### Order Completed
```json
{
  "orderNumber": "INV-TEST-001",
  "customerName": "Test User",
  "phone": "6281234567890"
}
```

### Order Cancelled
```json
{
  "orderNumber": "INV-TEST-001",
  "customerName": "Test User",
  "phone": "6281234567890",
  "reason": "Out of stock"
}
```

### Payment Expired
```json
{
  "orderNumber": "INV-TEST-001",
  "customerName": "Test User",
  "phone": "6281234567890",
  "total": "Rp 500,000"
}
```

### Refund Requested (ke Admin)
```json
{
  "orderNumber": "INV-TEST-001",
  "customerName": "Test User",
  "adminPhone": "628123456789",
  "amount": "Rp 500,000",
  "reason": "Product defect"
}
```

### Security Alert (ke Admin)
```json
{
  "adminPhone": "628123456789",
  "alertType": "Suspicious Login",
  "ipAddress": "192.168.1.1",
  "userId": "user-123",
  "details": "Multiple failed login attempts",
  "timestamp": "2025-12-29 01:50:00"
}
```

### Error Spike (ke Admin)
```json
{
  "adminPhone": "628123456789",
  "errorCount": 50,
  "timeWindow": "5 minutes",
  "errorType": "Database Connection",
  "endpoint": "/api/orders",
  "timestamp": "2025-12-29 01:50:00"
}
```

---

## 📊 Monitoring

### n8n Cloud Dashboard

1. **Executions Tab:**
   - Lihat semua workflow runs
   - Success/Failed status
   - Klik untuk detail

2. **Workflow Tab:**
   - Lihat active workflows (harus 10)
   - Last execution time

### Check Logs

1. Klik workflow name
2. Tab **"Executions"**
3. Klik execution tertentu
4. Lihat input/output setiap node

---

## 🆘 Troubleshooting

### Webhook Tidak Terpanggil

**Check:**
- [ ] Workflow ACTIVE? (toggle switch ON)
- [ ] URL benar di `.env`?
- [ ] Test dengan curl manual

### Message Tidak Terkirim

**Check:**
- [ ] WAHA running? Test: `curl https://waha.infiya.store/api/sessions`
- [ ] Session connected? Check WAHA dashboard
- [ ] Phone format benar? (628xxx@c.us)

### n8n Execution Failed

**Check:**
- [ ] n8n → Executions → klik failed execution
- [ ] Lihat error di node yang merah
- [ ] Check input data format

---

## 💰 Pricing Reminder

**n8n.io Cloud:**
- Trial: FREE 14 hari
- Starter: $20/bulan (10,000 executions)
- Pro: $50/bulan (50,000 executions)

**Estimasi untuk 100-500 orders/bulan:**
- Starter plan sudah cukup ✅

---

## 📚 Full Documentation

- **Detailed Setup:** `docs/N8N_CLOUD_WAHA_SETUP.md`
- **Audit Report:** `n8n-workflows/AUDIT_REPORT.md`
- **WhatsApp Setup:** `docs/WHATSAPP_SETUP_GUIDE.md`

---

**Setup Time:** ~15 menit  
**Status:** Production Ready ✅  
**Last Updated:** 2025-12-29
