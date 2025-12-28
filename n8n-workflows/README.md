# 📱 n8n Workflows - Infiatin Store

**WhatsApp Notification Automation via n8n Cloud + WAHA**

---

## 📁 Isi Folder

### **Workflow Files (10)**
✅ Semua sudah dikonfigurasi dengan WAHA URL: `https://waha.infiya.store/api/sendText`

1. **WA_OTP_VERIFICATION.json** - Kirim kode OTP verifikasi
2. **WA_ORDER_CREATED.json** - Notifikasi pesanan baru dibuat
3. **WA_PAYMENT_SUCCESS.json** - Konfirmasi pembayaran berhasil
4. **WA_ORDER_SHIPPED.json** - Notifikasi pesanan dikirim + resi
5. **WA_ORDER_COMPLETED.json** - Pesanan selesai, request review
6. **WA_ORDER_CANCELLED.json** - Notifikasi pesanan dibatalkan
7. **WA_PAYMENT_EXPIRED.json** - Pembayaran kedaluwarsa
8. **WA_REFUND_REQUESTED.json** - Alert admin: permintaan refund
9. **WA_SECURITY_ALERT.json** - Alert admin: aktivitas mencurigakan
10. **WA_ERROR_SPIKE.json** - Alert admin: lonjakan error

### **Documentation**
- **QUICK_SETUP.md** - Setup cepat 15 menit (START HERE 👈)
- **AUDIT_REPORT.md** - Audit lengkap kompatibilitas n8n Cloud

---

## 🚀 Quick Start

### **1. Cek Prerequisites**
```bash
# Test WAHA running
curl https://waha.infiya.store/api/sessions
```

Response harus: `status: "WORKING"` ✅

### **2. Import ke n8n.io Cloud**
1. Login: https://app.n8n.cloud/
2. Import 10 workflow files (lihat QUICK_SETUP.md)
3. Setup credential "WAHA API Key" (1x saja)
4. Activate semua workflows

### **3. Update .env**
```env
N8N_WEBHOOK_OTP="https://yourinstance.app.n8n.cloud/webhook/otp-verification"
N8N_WEBHOOK_ORDER_CREATED="https://yourinstance.app.n8n.cloud/webhook/order-created"
# ... dan seterusnya (10 total)
```

### **4. Test**
```bash
curl -X POST https://yourinstance.app.n8n.cloud/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"TEST","customerName":"User","phone":"628xxx","total":"100000","itemsCount":1}'
```

### **5. Deploy**
```bash
git add .
git commit -m "feat: n8n cloud webhooks"
git push
```

---

## ✅ Status

| Item | Status |
|------|--------|
| **WAHA URL** | ✅ Configured (`https://waha.infiya.store`) |
| **n8n Cloud Compatible** | ✅ 100% (no custom nodes) |
| **Workflows Ready** | ✅ 10/10 |
| **API Authentication** | ✅ Header Auth configured |
| **Production Ready** | ✅ Yes |

---

## 📊 Workflow Details

### Customer Notifications (7)
- OTP Verification
- Order Created
- Payment Success
- Order Shipped
- Order Completed
- Order Cancelled
- Payment Expired

### Admin Notifications (3)
- Refund Requested
- Security Alert
- Error Spike

---

## 🔧 Technical Details

**Architecture:**
```
[Vercel App] → [n8n Cloud Webhook] → [WAHA API] → [WhatsApp]
```

**Nodes Used:**
- `n8n-nodes-base.webhook` - Receive triggers
- `n8n-nodes-base.httpRequest` - Send to WAHA
- `n8n-nodes-base.if` - Validation (6 workflows)

**Authentication:**
- Method: Header Auth
- Header: `X-Api-Key`
- Value: `infiatin-store-2025DEC-9K7XQ2M8L4A6`

**WAHA Endpoint:**
- URL: `https://waha.infiya.store/api/sendText`
- Method: POST
- Body: JSON

---

## 💰 Cost

**n8n.io Cloud:**
- Trial: FREE (14 hari)
- Starter: $20/bulan (10K executions)

**Untuk 100-500 orders/bulan:** Starter plan cukup ✅

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `QUICK_SETUP.md` | Setup guide 15 menit |
| `AUDIT_REPORT.md` | Audit kompatibilitas |
| `../docs/N8N_CLOUD_WAHA_SETUP.md` | Setup detail lengkap |
| `../docs/WHATSAPP_SETUP_GUIDE.md` | WAHA setup guide |

---

## 🔄 Migration Path

**Current:** n8n.io Cloud (trial)  
**Option 1:** Upgrade ke Starter ($20/bulan)  
**Option 2:** Migrate ke Self-Hosted (gratis, butuh VPS)

Workflows ini **100% portable** - bisa migrate kapan saja tanpa perubahan!

---

## 🆘 Support

**Setup Issues?**
1. Check QUICK_SETUP.md
2. Check AUDIT_REPORT.md
3. Review full docs di `../docs/`

**WAHA Issues?**
- Test: `curl https://waha.infiya.store/api/sessions`
- Check WhatsApp session connected

**n8n Issues?**
- Dashboard → Executions tab
- Check failed execution logs

---

## 🎯 Next Steps

1. ✅ **Read:** `QUICK_SETUP.md`
2. ✅ **Import:** 10 workflows ke n8n Cloud
3. ✅ **Test:** Semua notifications
4. ✅ **Deploy:** Update .env & push to Vercel
5. ✅ **Monitor:** n8n Executions tab

---

**Ready to Go!** 🚀  
**Setup Time:** ~15 menit  
**Last Updated:** 2025-12-29 01:54 WIB
