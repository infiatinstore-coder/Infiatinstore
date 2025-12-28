# 📱 WhatsApp Notification Setup Guide
**Infiatin Store - n8n + WAHA Integration**

---

## 🎯 Tujuan
Mengaktifkan notifikasi WhatsApp otomatis untuk:
1. ✅ **Order Created** - Notifikasi saat order dibuat
2. 💰 **Payment Success** - Notifikasi saat pembayaran berhasil
3. 📦 **Order Shipped** - Notifikasi saat pesanan dikirim

---

## 🏗️ Arsitektur

```
[Infiya Store API] 
    ↓ (Webhook Call)
[n8n Workflow]
    ↓ (HTTP Request)
[WAHA API Server]
    ↓ (Send Message)
[WhatsApp]
```

---

## 📋 Requirement

### 1. **WAHA (WhatsApp HTTP API)**
- Install WAHA di server/localhost
- Docs: https://waha.devlike.pro/docs/how-to/install/
- Docker (Recommended):
  ```bash
  docker run -it -p 3123:3000 devlikeapro/waha
  ```

### 2. **n8n Workflow Automation**
- Self-hosted: https://docs.n8n.io/hosting/
- Cloud: https://n8n.io/ (Free tier available)
  
---

## 🔧 Setup Step-by-Step

### Step 1: Setup WAHA

1. **Install WAHA via Docker:**
   ```bash
   docker run -d --name waha -p 3123:3000 -e WAHA_PRINT_QR=True devlikeapro/waha
   ```

2. **Scan QR Code untuk koneksi WhatsApp:**
   - Buka: `http://localhost:3123/`
   - Akan muncul QR Code
   - Scan dengan WhatsApp Business

3. **Test API:**
   ```bash
   curl -X POST http://localhost:3123/api/sendText \
     -H "Content-Type: application/json" \
     -d '{
       "session": "default",
       "chatId": "6281234567890@c.us",
       "text": "Test message from Infiatin Store!"
     }'
   ```

---

### Step 2: Import n8n Workflows

File workflow sudah tersedia di `n8n-workflows/`:
- `WA_ORDER_CREATED.json`
- `WA_PAYMENT_SUCCESS.json`
- `WA_ORDER_SHIPPED.json`

**Import ke n8n:**
1. Login ke n8n dashboard
2. Create New Workflow
3. Click **"..."** → **Import from File**
4. Upload file JSON
5. **Activate** workflow

---

### Step 3: Get Webhook URLs

Setelah import workflows, dapatkan webhook URL dari setiap workflow:

1. **Order Created Webhook:**
   - Path: `/webhook/order-created`
   - URL Production: `https://your-n8n-domain.com/webhook/order-created`
   - URL Test: `https://your-n8n-domain.com/webhook-test/order-created`

2. **Payment Success Webhook:**
   - Path: `/webhook/payment-success`
   - URL Production: `https://your-n8n-domain.com/webhook/payment-success`

3. **Order Shipped Webhook:**
   - Path: `/webhook/order-shipped`
   - URL Production: `https://your-n8n-domain.com/webhook/order-shipped`

---

### Step 4: Configure .env

Tambahkan webhook URLs ke file `.env`:

```env
# ==============================================
# WHATSAPP NOTIFICATIONS (via n8n + WAHA)
# ==============================================
N8N_WEBHOOK_ORDER_CREATED="https://your-n8n-domain.com/webhook/order-created"
N8N_WEBHOOK_PAYMENT_SUCCESS="https://your-n8n-domain.com/webhook/payment-success"
N8N_WEBHOOK_ORDER_SHIPPED="https://your-n8n-domain.com/webhook/order-shipped"

# WAHA Configuration (for n8n workflows)
# Note: n8n workflows akan menggunakan URL ini
WAHA_API_URL="http://localhost:3123/api"
```

---

### Step 5: Update n8n Workflows

Di setiap workflow n8n, update node **"Send WA"** dengan WAHA URL Anda:

```json
{
  "method": "POST",
  "url": "http://YOUR_WAHA_IP:3123/api/sendText",
  "jsonParameters": true,
  "bodyParametersJson": "{\n  \"session\": \"default\",\n  \"chatId\": \"={{ $json.phone }}@c.us\",\n  \"text\": \"...\"\n}"
}
```

**⚠️ PENTING:**
- Jika n8n dan WAHA di server berbeda, gunakan IP public
- Jika di server sama, bisa pakai `localhost` atau internal IP
- Format phone: `628xxx` (tanpa +, tanpa 0 di depan)

---

## 🧪 Testing

### Test 1: Order Created
```bash
curl -X POST https://your-n8n-domain.com/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "phone": "628123456789",
    "total": 500000
  }'
```

### Test 2: Payment Success
```bash
curl -X POST https://your-n8n-domain.com/webhook/payment-success \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "phone": "628123456789"
  }'
```

### Test 3: Order Shipped
```bash
curl -X POST https://your-n8n-domain.com/webhook/order-shipped \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "INV-TEST-001",
    "phone": "628123456789",
    "courier": "JNE",
    "trackingNumber": "JP1234567890"
  }'
```

---

## 📝 Message Templates

### 1. Order Created
```
🎉 Pesanan *INV-251225-XXXXX* berhasil dibuat.
Total: Rp 500,000
Menunggu pembayaran.
```

### 2. Payment Success
```
✅ Pembayaran *INV-251225-XXXXX* BERHASIL.
Pesanan segera diproses.
```

### 3. Order Shipped
```
📦 Pesanan *INV-251225-XXXXX* telah dikirim.
Kurir: JNE
Resi: JP1234567890
```

---

## 🔒 Security Best Practices

1. **API Authentication:**
   - Tambahkan header authentication di n8n webhook
   - Validasi request signature dari Infiya Store

2. **Rate Limiting:**
   - Set rate limit di n8n untuk prevent spam

3. **Error Handling:**
   - Log semua failed notifications
   - Retry mechanism untuk failed sends

---

## 🚀 Production Checklist

- [ ] WAHA running dengan session stabil
- [ ] n8n workflows active di production mode
- [ ] Webhook URLs sudah di .env production
- [ ] Test semua 3 notification types
- [ ] Setup monitoring/logging untuk failures
- [ ] Configure retry mechanism
- [ ] Setup alerting untuk session disconnected

---

## 📊 Monitoring

Untuk memonitor status WhatsApp:
1. **WAHA Status:** `GET http://localhost:3123/api/sessions`
2. **n8n Execution Log:** Check di dashboard n8n
3. **Application Log:** Check console log Infiya Store

---

## 🆘 Troubleshooting

### Issue: QR Code tidak muncul
- Cek Docker container: `docker logs waha`
- Restart container: `docker restart waha`

### Issue: Message tidak terkirim
- Cek session status di WAHA
- Verify phone format (628xxx@c.us)
- Check WAHA logs untuk error

### Issue: Webhook tidak terpanggil
- Verify URL di .env benar
- Test webhook dengan curl
- Check firewall/network access

---

## 📚 Resources

- **WAHA Docs:** https://waha.devlike.pro/docs/
- **n8n Docs:** https://docs.n8n.io/
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp

---

**Status:** ⏳ Ready to Configure  
**Priority:** MEDIUM  
**Estimated Setup Time:** 30-60 minutes
