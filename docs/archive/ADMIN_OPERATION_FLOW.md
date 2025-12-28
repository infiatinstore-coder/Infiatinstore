# ADMIN OPERATION FLOW
**Project:** infiya.store  
**Version:** 1.0  
**Date:** 2025-12-23  
**Status:** 🔒 LOCKED - PRODUCTION READY  
**Source of Truth:** ORDER_PAYMENT_RULES.md

---

## RINGKASAN EKSEKUTIF

Dokumen ini adalah **PANDUAN OPERASIONAL HARIAN** untuk admin infiya.store.

**Prinsip Utama:**
- Admin adalah OPERATOR, bukan PENGUBAH data payment
- Payment status ditentukan oleh GATEWAY, bukan admin
- Order status mengikuti PAYMENT status (strict state machine)
- Setiap aksi admin DICATAT dan DIAUDIT

**Jika Ragu:** STOP → Eskalasi ke Owner

---

## 1. ROLE & HAK AKSES ADMIN

### 1.1 SUPER_ADMIN

**Hak Akses:**
- ✅ Melihat semua order
- ✅ Melihat detail order + payment info (READ ONLY)
- ✅ Mengubah status order (dengan batasan strict)
- ✅ Menambah tracking number
- ✅ Menambahkan catatan internal
- ✅ Melihat log perubahan status
- ✅ Melihat analytics & statistics

**Batasan:**
- ❌ **TIDAK BISA** mengubah order ke PAID
- ❌ **TIDAK BISA** mengubah order ke FAILED
- ❌ **TIDAK BISA** mengubah payment status
- ❌ **TIDAK BISA** mengedit harga setelah order PAID
- ❌ **TIDAK BISA** menghapus order
- ❌ **TIDAK BISA** rollback dari PAID ke PENDING_PAYMENT

**Aksi yang DIIZINKAN:**
1. Update PROCESSING → SHIPPED
2. Update SHIPPED → COMPLETED
3. Add tracking number
4. Add internal notes
5. View order history
6. Search & filter orders

---

### 1.2 STAFF_ORDER (Future - Jika Diperlukan)

**Hak Akses:**
- ✅ Melihat order list
- ✅ Melihat detail order (terbatas)
- ✅ Menambahkan catatan
- ⚠️ Update status **HANYA** PROCESSING → SHIPPED

**Batasan:**
- ❌ Sama seperti SUPER_ADMIN
- ❌ Tidak bisa update ke COMPLETED (hanya SUPER_ADMIN)
- ❌ Tidak bisa edit tracking number setelah dikirim

**Catatan:** Role ini saat ini BELUM diimplementasi. Semua admin = SUPER_ADMIN.

---

## 2. DAFTAR AKSI ADMIN YANG VALID

### 2.1 MELIHAT DAFTAR ORDER

**A. Nama Aksi:** View Order List

**B. Syarat:** Tidak ada (selalu boleh)

**C. Aksi yang Dilakukan:**
- GET `/api/admin/orders`
- Filter by status, date range, search query
- Pagination

**D. Perubahan Status:** TIDAK ADA (read-only)

**E. Dampak:**
- Order: Tidak ada
- Payment: Tidak ada
- Stock: Tidak ada

**F. Logging:** Tidak wajib (optional access log)

**G. Error yang Mungkin:**
- 401 Unauthorized (token expired)
- 500 Database error

**H. Respon Sistem:**
```json
{
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 2.2 MEMBUKA DETAIL ORDER

**A. Nama Aksi:** View Order Detail

**B. Syarat:** Order harus exist

**C. Aksi yang Dilakukan:**
- GET `/api/admin/orders/{id}`
- Menampilkan:
  - Order info (items, customer, address)
  - Payment info (status, method, amount) - **READ ONLY**
  - Shipment info (courier, tracking)
  - Order state history log

**D. Perubahan Status:** TIDAK ADA (read-only)

**E. Dampak:**
- Order: Tidak ada
- Payment: Tidak ada
- Stock: Tidak ada

**F. Logging:** Optional (untuk audit trail access)

**G. Error yang Mungkin:**
- 404 Order not found
- 401 Unauthorized

**H. Respon Sistem:**
```json
{
  "order": {
    "id": "...",
    "orderNumber": "ORD-20230123-001",
    "status": "PAID",
    "total": 250000,
    "customer": {...},
    "items": [...],
    "payment": {
      "status": "SUCCESS",
      "method": "midtrans",
      "paidAt": "2023-01-23T10:30:00Z"
    },
    "shipment": {
      "status": "PENDING",
      "courier": "JNE",
      "trackingNumber": null
    }
  }
}
```

**Apa yang Admin LIHAT:**
- Payment status = SUCCESS → **JANGAN SENTUH** (sudah benar)
- Order status = PAID → Siap diproses ke PROCESSING

---

### 2.3 MENGUBAH PAID → PROCESSING

**A. Nama Aksi:** Start Processing Order

**B. Syarat Order Status:** **HANYA** PAID

**C. Aksi yang Dilakukan:**
- PATCH `/api/admin/orders`
- Body: `{ orderId, status: "PROCESSING", notes: "..." }`
- Admin mulai proses packing barang

**D. Perubahan Status:** PAID → PROCESSING

**E. Dampak:**
- **Order:** Status berubah ke PROCESSING
- **Payment:** TIDAK ADA (payment sudah SUCCESS, tidak berubah)
- **Stock:** TIDAK ADA (stock sudah dikurangi saat PAID)

**F. Logging yang WAJIB:**
```javascript
OrderStateLog.create({
  orderId,
  fromStatus: 'PAID',
  toStatus: 'PROCESSING',
  changedBy: adminUserId, // ID admin yang melakukan
  reason: 'Admin update via dashboard',
  metadata: { notes: '...' },
  createdAt: now()
})
```

**G. Error yang Mungkin:**
1. **Order bukan status PAID**
   - Error: "Invalid status transition: PROCESSING → PAID"
   - Artinya: Order masih PENDING_PAYMENT atau sudah lewat PROCESSING

2. **Order sudah PROCESSING**
   - Error: "Invalid status transition: PROCESSING → PROCESSING"
   - Artinya: Double click, order sudah diproses

**H. Respon Sistem:**
- **SUCCESS:**
  ```json
  {
    "message": "Status pesanan berhasil diupdate",
    "order": {
      "id": "...",
      "orderNumber": "ORD-...",
      "status": "PROCESSING"
    }
  }
  ```

- **ERROR:**
  ```json
  {
    "error": "Gagal mengupdate status: Invalid status transition...",
    "hint": "Periksa apakah transisi status valid"
  }
  ```

**Apa yang Admin HARUS PASTIKAN:**
- ✅ Order status = PAID (hijau di dashboard)
- ✅ Payment status = SUCCESS
- ✅ Barang ready untuk dipacking
- ⚠️ Jangan skip status (tidak bisa langsung PAID → SHIPPED)

---

### 2.4 MENGUBAH PROCESSING → SHIPPED

**A. Nama Aksi:** Ship Order

**B. Syarat Order Status:** **HANYA** PROCESSING

**C. Aksi yang Dilakukan:**
- PATCH `/api/admin/orders`
- Body: `{ orderId, status: "SHIPPED", trackingNumber: "JNE123456", notes: "..." }`
- Admin sudah serahkan barang ke kurir

**D. Perubahan Status:** PROCESSING → SHIPPED

**E. Dampak:**
- **Order:** Status → SHIPPED
- **Payment:** Tidak ada
- **Stock:** Tidak ada
- **Shipment:** 
  - trackingNumber updated
  - shippedAt = now()
  - status = IN_TRANSIT

**F. Logging yang WAJIB:**
```javascript
OrderStateLog.create({
  orderId,
  fromStatus: 'PROCESSING',
  toStatus: 'SHIPPED',
  changedBy: adminUserId,
  reason: 'Admin update via dashboard',
  metadata: { 
    trackingNumber: 'JNE123456',
    notes: '...' 
  },
  createdAt: now()
})
```

**G. Error yang Mungkin:**
1. **Tracking number kosong (optional error)**
   - Warning: "Sebaiknya masukkan tracking number"
   - Sistem tetap izinkan (tracking bisa ditambah kemudian)

2. **Order bukan PROCESSING**
   - Error: "Invalid status transition"
   - Admin harus pastikan order sudah di-PROCESSING dulu

**H. Respon Sistem:**
- **SUCCESS:**
  ```json
  {
    "message": "Status pesanan berhasil diupdate",
    "order": {
      "status": "SHIPPED",
      "trackingNumber": "JNE123456"
    }
  }
  ```

**Apa yang Admin HARUS LAKUKAN:**
- ✅ Input tracking number dari kurir
- ✅ Pastikan barang sudah benar-benar diserahkan
- ✅ Catat notes jika ada (nama kurir, dll)

---

### 2.5 MENGUBAH SHIPPED → COMPLETED

**A. Nama Aksi:** Mark Order as Completed

**B. Syarat Order Status:** **HANYA** SHIPPED

**C. Aksi yang Dilakukan:**
- PATCH `/api/admin/orders`
- Body: `{ orderId, status: "COMPLETED" }`
- Order sudah diterima customer atau auto-complete setelah N hari

**D. Perubahan Status:** SHIPPED → COMPLETED

**E. Dampak:**
- **Order:** Status → COMPLETED (terminal state)
- **Payment:** Tidak ada
- **Stock:** Tidak ada
- **User Points:** User mendapat loyalty points (automatic)
  - Formula: Math.floor(total / 1000) points
  - Contoh: Rp 250.000 = 250 points

**F. Logging yang WAJIB:**
```javascript
OrderStateLog.create({
  orderId,
  fromStatus: 'SHIPPED',
  toStatus: 'COMPLETED',
  changedBy: adminUserId,
  reason: 'Admin marked as completed',
  metadata: { completedAt: now() },
  createdAt: now()
})

PointTransaction.create({
  userId,
  type: 'EARN_PURCHASE',
  amount: 250,
  description: 'Poin dari order ORD-...',
  orderId
})
```

**G. Error yang Mungkin:**
1. **Order belum SHIPPED**
   - Error: "Invalid status transition"
   - Admin tidak bisa skip langsung dari PROCESSING

2. **Order sudah COMPLETED**
   - Error: "Invalid transition: COMPLETED is terminal"
   - Double click, order sudah selesai

**H. Respon Sistem:**
- **SUCCESS:**
  ```json
  {
    "message": "Pesanan ditandai sebagai selesai. User mendapat 250 poin.",
    "order": {
      "status": "COMPLETED"
    }
  }
  ```

**Kapan Admin BOLEH mark COMPLETED:**
- ✅ Customer sudah konfirmasi terima barang
- ✅ Sudah lewat 7 hari sejak SHIPPED (auto-complete policy)
- ✅ Tracking status = DELIVERED

**Kapan Admin HARUS TUNGGU:**
- ⚠️ Belum 7 hari dan customer belum konfirmasi
- ⚠️ Customer komplain barang belum sampai

---

### 2.6 MENAMBAHKAN TRACKING NUMBER

**A. Nama Aksi:** Add/Update Tracking Number

**B. Syarat Order Status:** PROCESSING atau SHIPPED

**C. Aksi yang Dilakukan:**
- PATCH `/api/admin/orders`
- Body: `{ orderId, trackingNumber: "JNE123456" }`
- Update tracking number (lupa input atau salah input)

**D. Perubahan Status:** TIDAK ADA (hanya update tracking)

**E. Dampak:**
- **Order:** Tidak ada
- **Payment:** Tidak ada
- **Stock:** Tidak ada
- **Shipment:** trackingNumber updated

**F. Logging:** Optional (log di shipment table)

**G. Error yang Mungkin:**
- Order bukan PROCESSING/SHIPPED
- Tracking number format invalid (optional validation)

**H. Respon Sistem:**
```json
{
  "message": "Tracking number berhasil diupdate",
  "trackingNumber": "JNE123456"
}
```

---

### 2.7 MENAMBAHKAN CATATAN INTERNAL

**A. Nama Aksi:** Add Internal Notes

**B. Syarat:** Order exist, status apapun

**C. Aksi yang Dilakukan:**
- PATCH `/api/admin/orders`
- Body: `{ orderId, notes: "Customer request gift wrap" }`
- Catatan internal untuk admin lain

**D. Perubahan Status:** TIDAK ADA

**E. Dampak:**
- **Order:** notes field updated
- **Payment:** Tidak ada
- **Stock:** Tidak ada

**F. Logging:** OrderStateLog (changedBy = admin, reason = "Notes added")

**G. Error yang Mungkin:**
- Notes terlalu panjang (max 1000 chars)

**H. Respon Sistem:**
```json
{
  "message": "Catatan berhasil ditambahkan"
}
```

**Use Case:**
- Customer request special packaging
- Alamat perlu klarifikasi
- Barang pre-order, tunggu stock
- Koordinasi dengan gudang

---

### 2.8 MENCARI ORDER BERMASALAH

**A. Nama Aksi:** Search & Filter Orders

**B. Syarat:** Tidak ada

**C. Aksi yang Dilakukan:**
- GET `/api/admin/orders?status=PAID&dateFrom=2023-01-01`
- GET `/api/admin/orders?search=customer@email.com`
- Filter untuk menemukan order stuck atau bermasalah

**D. Perubahan Status:** TIDAK ADA (read-only)

**E. Dampak:** Tidak ada

**F. Logging:** Optional (search log untuk analytics)

**G. Error:** Standard API errors

**H. Respon Sistem:** List of matching orders

**Filter yang Berguna:**
- `status=PAID` → Order yang belum diproses (lama di PAID)
- `status=PROCESSING` → Order yang belum dikirim
- `dateFrom` + `dateTo` → Range tanggal tertentu
- `search` → Cari by email, order number, phone

**Red Flags untuk Admin:**
- Order PAID lebih dari 24 jam → URGENT process
- Order PROCESSING lebih dari 3 hari → Check stock
- Order SHIPPED tapi belum COMPLETED 14 hari → Check kurir

---

### 2.9 MELIHAT RIWAYAT PAYMENT (READ ONLY)

**A. Nama Aksi:** View Payment History

**B. Syarat:** Order exist

**C. Aksi yang Dilakukan:**
- GET `/api/admin/orders/{id}` → include payment data
- Melihat payment logs (webhook history)

**D. Perubahan Status:** TIDAK ADA

**E. Dampak:** Tidak ada (read-only)

**F. Logging:** Tidak wajib

**G. Error:** Standard API errors

**H. Respon Sistem:**
```json
{
  "payment": {
    "id": "...",
    "status": "SUCCESS",
    "method": "midtrans",
    "amount": 250000,
    "paidAt": "2023-01-23T10:30:00Z",
    "gatewayTransactionId": "...",
    "gatewayResponse": {...}
  },
  "paymentLogs": [
    {
      "transactionId": "...",
      "status": "settlement",
      "processedAt": "2023-01-23T10:30:00Z"
    }
  ]
}
```

**Yang Admin BOLEH LIHAT:**
- ✅ Payment status (SUCCESS/FAILED/PENDING)
- ✅ Payment method
- ✅ Amount
- ✅ Gateway transaction ID
- ✅ Webhook logs (untuk debugging)

**Yang Admin TIDAK BOLEH UBAH:**
- ❌ Payment status
- ❌ Amount
- ❌ Transaction ID
- ❌ Gateway response

**Use Case:**
- Customer tanya "Kok belum PAID?"
  - Admin cek payment status
  - Kalau PENDING → tunggu gateway
  - Kalau SUCCESS tapi order PENDING_PAYMENT → BUG (eskalasi)

---

## 3. AKSI YANG DILARANG KERAS

### 3.1 MENGUBAH ORDER KE PAID

**Aksi:** Admin coba set order status = PAID

**Alasan Dilarang:**
- ORDER_PAYMENT_RULES.md section 5: **ORDER ≠ PAID sebelum PAYMENT = SUCCESS**
- Order hanya boleh PAID via payment gateway callback
- Admin tidak punya otoritas menentukan payment valid

**Konsekuensi jika Dipaksa:**
```json
HTTP 403 Forbidden
{
  "error": "FORBIDDEN: Admin tidak boleh mengubah status ke PAID secara manual. Status PAID hanya bisa diubah otomatis via payment gateway callback.",
  "currentStatus": "PENDING_PAYMENT",
  "paymentStatus": "PENDING"
}
```

**Log yang Dicatat:**
```javascript
AuditLog.create({
  userId: adminId,
  action: 'ATTEMPTED_MANUAL_PAID',
  entityType: 'ORDER',
  entityId: orderId,
  result: 'BLOCKED',
  reason: 'Guard violation: admin cannot set PAID',
  timestamp: now()
})
```

**Apa yang Harus Admin Lakukan:**
- ✅ Tunggu payment gateway callback
- ✅ Cek payment status via dashboard (read-only)
- ✅ Jika stuck lebih dari 1 jam → eskalasi ke Owner/Tech

---

### 3.2 MENGUBAH ORDER KE FAILED

**Aksi:** Admin coba set order status = FAILED

**Alasan Dilarang:**
- ORDER_PAYMENT_RULES.md section 5: **FAILED payment → FAILED order**
- Status FAILED hanya untuk payment yang gagal
- Admin tidak bisa declare payment failed (hanya gateway)

**Konsekuensi jika Dipaksa:**
```json
HTTP 403 Forbidden
{
  "error": "FORBIDDEN: Admin tidak boleh mengubah status ke FAILED secara manual. Status FAILED hanya bisa diubah otomatis via payment gateway callback.",
  "currentStatus": "PENDING_PAYMENT"
}
```

**Yang Benar:**
- Payment gateway akan kirim webhook "deny" atau "cancel"
- Sistem otomatis set payment = FAILED, order = FAILED
- Admin hanya bisa LIHAT hasil akhir

---

### 3.3 MENGUBAH PAID → CANCELLED

**Aksi:** Admin coba cancel order yang sudah PAID

**Alasan Dilarang:**
- ORDER_PAYMENT_RULES.md section 7: "Admin TIDAK BOLEH mengubah PAID → CANCELLED"
- ORDER_PAYMENT_RULES.md section 3: "Tidak boleh mundur status"
- Stock sudah dikurangi saat PAID
- Customer sudah bayar (uang masuk)

**Konsekuensi jika Dipaksa:**
```json
HTTP 400 Bad Request
{
  "error": "Gagal mengupdate status: Invalid status transition: PAID → CANCELLED. Allowed transitions: PROCESSING",
  "hint": "Periksa apakah transisi status valid"
}
```

**State Machine Block:**
```javascript
VALID_TRANSITIONS = {
  PAID: ['PROCESSING'], // HANYA PROCESSING
  // CANCELLED not allowed from PAID
}
```

**Apa yang Harus Admin Lakukan Jika Customer Minta Cancel:**
1. Order masih PENDING_PAYMENT → Boleh cancel (customer sendiri)
2. Order sudah PAID → **TIDAK BISA CANCEL**
   - Opsi: Eskalasi ke Owner
   - Future: Implement REFUND (out of scope saat ini)
   - Sementara: Koordinasi manual with customer

---

### 3.4 MENGUBAH PAYMENT STATUS

**Aksi:** Admin coba ubah payment status via API

**Alasan Dilarang:**
- ORDER_PAYMENT_RULES.md section 6.3: "Admin tidak boleh override callback"
- Payment status ditentukan oleh gateway
- Mengubah manual = fraud risk

**Konsekuensi:**
- Endpoint tidak tersedia untuk admin
- Jika ada, akan blocked 403

**Yang Benar:**
- Payment status **READ ONLY** untuk admin
- Hanya payment gateway yang bisa update via webhook
- Admin hanya monitor, tidak edit

---

### 3.5 MENGEDIT TOTAL HARGA SETELAH PAID

**Aksi:** Admin coba edit order.total setelah PAID

**Alasan Dilarang:**
- ORDER_PAYMENT_RULES.md section 7: "Mengedit total harga order setelah PAID" = DILARANG
- Customer sudah bayar sesuai total
- Mengubah total = manipulasi data keuangan

**Konsekuensi:**
- Field `total` tidak editable via admin API
- Database constraint (jika ada)

**Yang Benar:**
- Total harga LOCKED setelah order created
- Jika salah hitung → order baru
- Tidak ada edit price setelah payment

---

### 3.6 ROLLBACK STATUS (Mundur)

**Aksi:** Admin coba rollback SHIPPED → PROCESSING

**Alasan Dilarang:**
- ORDER_PAYMENT_RULES.md section 3: "Tidak boleh mundur status"
- State machine hanya forward
- Rollback = data inconsistency

**Konsekuensi:**
```json
{
  "error": "Invalid status transition: SHIPPED → PROCESSING. Allowed transitions: COMPLETED"
}
```

**Yang Benar:**
- Status hanya maju (forward only)
- Jika salah klik → eskalasi (manual fix di database)
- Prevention: Konfirmasi dialog sebelum update

---

### 3.7 MENGHAPUS ORDER

**Aksi:** Admin coba delete order

**Alasan Dilarang:**
- Data persistence untuk audit & legal
- Order tidak boleh hilang dari sistem
- Soft delete saja (future)

**Konsekuensi:**
- Endpoint DELETE tidak tersedia
- Jika ada, minimal soft delete only

**Yang Benar:**
- Order tetap exist selamanya
- Status terminal (COMPLETED, CANCELLED, FAILED) = archived
- Tidak ada hard delete

---

## 4. SKENARIO NYATA OPERASIONAL

### SKENARIO 1: User Bayar, Admin Telat Proses

**Situasi:**
- Customer bayar pukul 09:00
- Payment SUCCESS → Order PAID
- Admin baru buka dashboard pukul 14:00 (5 jam kemudian)

**Apa yang Admin LIHAT:**
```
Order #ORD-20230123-001
Status: PAID (hijau)
Payment: SUCCESS
Total: Rp 250.000
Created: 2023-01-23 09:00
Paid: 2023-01-23 09:05
```

**Apa yang Admin BOLEH Lakukan:**
1. ✅ Klik "Process Order" → PAID → PROCESSING
2. ✅ Packing barang
3. ✅ Update ke SHIPPED dengan tracking number
4. ✅ Tambahkan notes: "Diproses hari yang sama meski sore"

**Apa yang Admin TIDAK BOLEH Lakukan:**
- ❌ Cancel karena "telat bayar" (order sudah PAID!)
- ❌ Skip langsung PAID → SHIPPED (harus via PROCESSING)
- ❌ Ubah payment status

**Respon Sistem yang BENAR:**
- Order masih normal
- No penalty untuk delay processing
- Track SLA internally (future: notifikasi jika PAID > 2 jam)

**Lesson:** Order PAID harus diproses ASAP, tapi tidak ada punishment dari sistem jika delay.

---

### SKENARIO 2: Payment SUCCESS tapi Admin Belum Buka Dashboard

**Situasi:**
- Customer bayar tengah malam (02:00)
- Payment gateway kirim webhook → Order PAID
- Admin baru online pukul 09:00

**Apa yang Admin LIHAT:**
```
Order List:
- ORD-20230123-001 | PAID | Rp 250.000 | 7 jam yang lalu
```

**Apa yang Admin BOLEH Lakukan:**
1. ✅ Buka detail order
2. ✅ Cek payment status = SUCCESS (confirm)
3. ✅ Cek stock available
4. ✅ Process order → PAID → PROCESSING

**Apa yang SISTEM Sudah Lakukan Otomatis (Tanpa Admin):**
- ✅ Terima payment webhook
- ✅ Update payment status = SUCCESS
- ✅ Update order status = PAID
- ✅ **Kurangi stock** (automatic saat PAID)
- ✅ Log semua perubahan

**Respon yang BENAR:**
- System berjalan 24/7 otomatis
- Admin hanya perlu process fisik (packing & shipping)
- No manual intervention needed untuk payment flow

**Lesson:** Payment flow fully automated. Admin fokus ke fulfillment saja.

---

### SKENARIO 3: User Komplain tapi Order Sudah PAID

**Situasi:**
- Customer WA: "Saya sudah transfer kok statusnya masih pending?"
- Admin cek dashboard:
  - Order status: PENDING_PAYMENT
  - Payment status: PENDING
  - Created: 10 menit yang lalu

**Apa yang Admin LIHAT:**
```
Order: ORD-20230123-001
Status: PENDING_PAYMENT (kuning/orange)
Payment:
  Status: PENDING
  Method: Midtrans - Bank Transfer
  Created: 10 menit yang lalu
  Expires: 23 jam 50 menit
```

**Apa yang Admin BOLEH Lakukan:**
1. ✅ Cek payment logs (webhook history) - ada callback pending?
2. ✅ Jelaskan ke customer: "Sistem menunggu konfirmasi dari bank, biasanya 5-15 menit"
3. ✅ Kasih tau cara cek status: "Tunggu email konfirmasi atau cek halaman order status"
4. ✅ Monitor 30 menit lagi

**Apa yang Admin TIDAK BOLEH Lakukan:**
- ❌ Manually set order = PAID
- ❌ Manually set payment = SUCCESS
- ❌ Minta customer transfer lagi
- ❌ Cancel order (biarkan expire otomatis jika tidak bayar)

**Timeline yang BENAR:**
- 0-15 menit: Normal waiting time
- 15-60 menit: Ask customer to confirm payment screenshot
- 60+ menit: Eskalasi ke tech/gateway support
- 24 jam: Auto-cancelled via webhook (expire)

**Respon Sistem:**
- Jika customer sudah bayar → webhook akan datang (wait)
- Jika webhook tidak datang 1 jam → check gateway dashboard manual
- Admin **TIDAK BISA** force payment SUCCESS

**Lesson:** Payment verification = gateway responsibility. Admin hanya monitor & komunikasi.

---

### SKENARIO 4: Admin Salah Klik Status

**Situasi:**
- Order status: PROCESSING
- Admin mau klik "SHIPPED" tapi tidak sengaja klik "COMPLETED"
- Browser submit request

**Apa yang SISTEM Lakukan:**
```javascript
Current: PROCESSING
Request: COMPLETED
State Machine Check: PROCESSING → COMPLETED?
Allowed: PROCESSING → ['SHIPPED']
Result: REJECTED
```

**Respon Sistem:**
```json
HTTP 400 Bad Request
{
  "error": "Gagal mengupdate status: Invalid status transition: PROCESSING → COMPLETED. Allowed transitions: SHIPPED",
  "hint": "Periksa apakah transisi status valid"
}
```

**Apa yang Admin LIHAT:**
- Error message di dashboard
- Order status masih PROCESSING (tidak berubah)
- No damage done

**Apa yang Admin Harus Lakukan:**
1. ✅ Read error message
2. ✅ Klik yang benar: SHIPPED
3. ✅ Continue normal flow

**Protection yang Bekerja:**
- State machine validation
- Invalid transitions blocked
- No rollback needed (transaction safe)

**Lesson:** State machine melindungi dari human error. Admin tidak bisa skip atau mundur status.

---

### SKENARIO 5: Order FAILED dan User Tanya Kenapa

**Situasi:**
- Customer komplain: "Order saya kok FAILED?"
- Admin cek dashboard:
  - Order status: FAILED (merah)
  - Payment status: FAILED
  - Payment method: Credit Card

**Apa yang Admin LIHAT:**
```
Order: ORD-20230123-001
Status: FAILED (merah)
Payment:
  Status: FAILED
  Method: Credit Card
  Gateway Response: "Card declined - insufficient funds"
  Failed At: 2023-01-23 09:05
```

**Apa yang Admin BOLEH Lakukan:**
1. ✅ Baca gateway response
2. ✅ Jelaskan ke customer: "Kartu kredit ditolak oleh bank karena limit tidak cukup"
3. ✅ Sarankan: "Silakan buat order baru dengan metode pembayaran lain"
4. ✅ Pastikan customer: Stock masih available (cek product page)

**Apa yang Admin TIDAK BOLEH Lakukan:**
- ❌ Ubah status FAILED → PAID
- ❌ Ubah payment status FAILED → SUCCESS
- ❌ Reuse order yang sama (order FAILED = terminal)
- ❌ Manually reduce stock

**Yang PENTING Dipahami:**
- FAILED = Payment gateway reject
- Bukan kesalahan sistem
- Bukan kesalahan customer (could be bank issue)
- Customer harus buat order baru

**Respon yang BENAR ke Customer:**
```
"Pesanan Anda gagal karena pembayaran ditolak oleh bank (limit tidak cukup). 
Order ini sudah ditutup sistem. Silakan buat pesanan baru dengan:
- Metode pembayaran lain (Transfer Bank, E-wallet), atau
- Kartu kredit lain dengan limit cukup

Stock produk masih tersedia untuk order baru."
```

**Lesson:** 
- FAILED = terminal state (tidak bisa recovery)
- Admin hanya monitor & komunikasi
- Solution = order baru

---

## 5. DEFINISI "AMAN SECARA OPERASIONAL"

### 5.1 Kapan Admin BOLEH Lanjut

**GREEN ZONE - Safe to Proceed:**

✅ **Order Status = PAID**
- Payment status = SUCCESS (confirmed)
- Stock sudah dikurangi otomatis
- Boleh lanjut → PROCESSING

✅ **Order Status = PROCESSING**
- Admin sudah mulai packing
- Barang ready
- Boleh lanjut → SHIPPED (+ tracking number)

✅ **Order Status = SHIPPED**
- Tracking number sudah ada
- Kurir sudah terima barang
- Tunggu delivery atau boleh mark COMPLETED jika:
  - Customer confirm received
  - Sudah 7+ hari dan no complaint

✅ **Payment Logs Complete**
- Webhook logs ada
- Signature verified
- Transaction ID match

**Indicators Admin Boleh Proceed:**
- 🟢 Status badge hijau (PAID, PROCESSING, SHIPPED)
- 🟢 Payment status = SUCCESS
- 🟢 No error logs in order history
- 🟢 Stock available (for new orders)

---

### 5.2 Kapan Admin Harus STOP

**YELLOW ZONE - Caution Required:**

⚠️ **Order Status = PENDING_PAYMENT lebih dari 2 jam**
- Check: Payment status masih PENDING?
- Check: Payment expired?
- Action: Monitor, jangan touch. Tunggu webhook atau expire.

⚠️ **Payment Status = SUCCESS tapi Order Status ≠ PAID**
- **RED FLAG:** Bug di system
- Action: **STOP** → Eskalasi ke tech
- Do NOT manually change order status

⚠️ **Order PAID tapi Stock = 0**
- Possible: Race condition (multiple orders simultaneous)
- Action: Check inventory logs
- Check: Apakah stock reduction sudah tercatat?
- Eskalasi jika inconsistent

⚠️ **Multiple Webhooks untuk Same Transaction**
- Check: PaymentLog.transactionId duplicate?
- System should handle idempotency
- If order status changed multiple times → investigate

**Indicators Admin Harus Stop:**
- 🟡 Status tidak match expected flow
- 🟡 Payment & Order status inconsistent
- 🟡 Stock logs missing
- 🟡 Error logs in OrderStateLog

---

### 5.3 Kapan Admin Harus Eskalasi

**RED ZONE - Escalate Immediately:**

🔴 **Payment SUCCESS but Order stuck PENDING_PAYMENT**
- Severity: CRITICAL
- Impact: Customer paid but no fulfillment
- Eskalasi: Owner + Tech ASAP
- SLA: Within 1 hour

🔴 **Order PAID but Stock Not Reduced**
- Severity: CRITICAL
- Impact: Overselling risk
- Check: InventoryLog untuk order ini
- Eskalasi: Tech team
- SLA: Within 30 minutes

🔴 **Double Payment (2 SUCCESS for 1 Order)**
- Severity: CRITICAL
- Impact: Customer charged twice
- Check: PaymentLog count
- Eskalasi: Owner + Finance + Tech
- SLA: Immediate

🔴 **Order Status Rollback (SHIPPED → PAID)**
- Severity: CRITICAL
- Impact: Data corruption or hack
- Eskalasi: Tech + Security
- SLA: Immediate

🔴 **Admin Cannot Login / 403 on Valid Action**
- Severity: HIGH
- Impact: Operations blocked
- Eskalasi: Tech
- SLA: Within 2 hours

**Escalation Format:**
```
TO: Owner / Tech Team
PRIORITY: CRITICAL / HIGH / MEDIUM

Order ID: ORD-20230123-001
Issue: Payment SUCCESS but Order stuck PENDING_PAYMENT
Current Status:
- Order Status: PENDING_PAYMENT
- Payment Status: SUCCESS
- Payment Method: Midtrans - Bank Transfer
- Paid At: 2023-01-23 09:05 (2 hours ago)

Expected: Order should be PAID after payment SUCCESS
Impact: Customer waiting for fulfillment

Logs:
- PaymentLog.transactionId: MT-123456
- OrderStateLog: No transition to PAID recorded

Action Needed: Investigate why order status not updated
```

---

### 5.4 Decision Tree untuk Admin

```
┌─────────────────────────────────────┐
│ Customer Report: "Masalah payment"  │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Cek Order Status di Dashboard        │
└──────────────┬───────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │             │
    PAID         PENDING_PAYMENT
        │             │
        ▼             ▼
  ✅ PROCEED    ┌─────────────────┐
  ke PROCESS   │ Cek Payment     │
               │ Status?         │
               └─────┬───────────┘
                     │
            ┌────────┼────────┐
            │        │        │
        SUCCESS  PENDING  FAILED
            │        │        │
            ▼        ▼        ▼
        🔴 BUG!  ⚠️ WAIT  ✅ EXPLAIN
        ESKALASI  15 min   to customer
                            (make new order)

```

**Cheat Sheet:**
| Order Status | Payment Status | Action |
|--------------|----------------|--------|
| PENDING_PAYMENT | PENDING | ⚠️ Wait (normal) |
| PENDING_PAYMENT | SUCCESS | 🔴 BUG - Eskalasi |
| PENDING_PAYMENT | FAILED | ✅ Normal - Order akan auto-FAILED |
| PAID | SUCCESS | ✅ Normal - Proceed to process |
| PAID | PENDING | 🔴 BUG - Eskalasi |
| PROCESSING | SUCCESS | ✅ Normal - Ship order |
| SHIPPED | SUCCESS | ✅ Normal - Wait delivery |

---

## 6. CATATAN RISIKO & MONITORING

### 6.1 Metrics yang Harus Dimonitor

**Daily Metrics:**
- ✅ Order PAID > 24 jam belum PROCESSING → **URGENT**
- ✅ Order PROCESSING > 3 hari belum SHIPPED → **CHECK**
- ✅ Order SHIPPED > 14 hari belum COMPLETED → **REVIEW**
- ✅ Payment PENDING > 2 jam → **MONITOR**
- ✅ Count order FAILED per day → **TREND**

**Weekly Metrics:**
- Total order COMPLETED
- Average processing time (PAID → SHIPPED)
- Average delivery time (SHIPPED → COMPLETED)
- Payment failure rate
- Stock inconsistency count

---

### 6.2 Red Flags untuk Admin

🚩 **Order yang Stuck:**
- PAID tapi tidak diproses 24 jam+
- PROCESSING tapi tidak ada tracking 3 hari+
- SHIPPED tapi COMPLETED > 14 hari

🚩 **Payment Anomaly:**
- Payment SUCCESS tapi order tidak PAID
- Payment PENDING > 6 jam (should expire at 24h)
- Duplicate payment logs for same transaction

🚩 **Stock Issues:**
- Order PAID tapi product stock not reduced
- Inventory logs missing for order
- Stock negative (overselling)

**Action:** Create report → Eskalasi setiap minggu

---

### 6.3 Audit Trail

**Setiap Aksi Admin HARUS Tercatat:**
```javascript
OrderStateLog {
  orderId: "...",
  fromStatus: "PAID",
  toStatus: "PROCESSING",
  changedBy: "admin-user-id-123", // WAJIB
  reason: "Admin update via dashboard",
  metadata: {
    ipAddress: "...",
    userAgent: "...",
    trackingNumber: "..." // if applicable
  },
  createdAt: "2023-01-23T10:00:00Z"
}
```

**Audit Questions:**
- Siapa yang mengubah status?
- Kapan?
- Dari status apa ke status apa?
- Kenapa?

**Retention:** Permanent (legal & audit requirement)

---

### 6.4 SLA Operasional (Rekomendasi)

| Milestone | Target | Alert Threshold |
|-----------|--------|-----------------|
| Payment SUCCESS → Order PAID | < 1 minute (automatic) | If stuck > 5 minutes |
| Order PAID → Admin start PROCESSING | < 2 hours | > 4 hours |
| Order PROCESSING → SHIPPED | < 24 hours | > 48 hours |
| Order SHIPPED → COMPLETED | < 7 days (auto) | > 14 days (manual check) |

**Note:** SLA untuk admin awareness. Sistem tidak enforce (belum ada penalty).

---

## 7. QUICK REFERENCE CARD

### Admin Action Cheat Sheet

| Action | From Status | To Status | Required Data | Can Skip? |
|--------|-------------|-----------|---------------|-----------|
| View list | - | - | - | - |
| View detail | - | - | - | - |
| Start process | PAID | PROCESSING | notes (optional) | ❌ No |
| Ship order | PROCESSING | SHIPPED | trackingNumber (recommended) | ❌ No |
| Mark complete | SHIPPED | COMPLETED | - | ❌ No |
| Add tracking | PROCESSING/SHIPPED | (same) | trackingNumber | ✅ Can update anytime |
| Add notes | any | (same) | notes | ✅ Anytime |

### Forbidden Actions

| Action | Why Forbidden | Error Code |
|--------|---------------|------------|
| Set PAID | Payment hanya via gateway | 403 |
| Set FAILED | Payment failure hanya via gateway | 403 |
| PAID → CANCELLED | Backward transition forbidden | 400 |
| PAID → PENDING | Rollback forbidden | 403 |
| Edit payment status | Gateway owns payment | 403 (endpoint N/A) |
| Edit price after PAID | Financial data immutable | 400 (endpoint N/A) |
| Delete order | Data persistence required | 404 (endpoint N/A) |
| Skip status | State machine enforced | 400 |

### Status Flow (Valid Only)

```
DRAFT (not used in current flow)
  ↓
PENDING_PAYMENT (customer checkout)
  ↓ ↓ ↓
  │ │ └──→ CANCELLED (expire/customer cancel)
  │ └────→ FAILED (payment failed)
  ↓
PAID (payment SUCCESS - automatic via webhook)
  ↓
PROCESSING (admin starts packing)
  ↓
SHIPPED (admin ships order + tracking)
  ↓
COMPLETED (delivery confirmed or auto after 7 days)
```

**Terminal States:** COMPLETED, CANCELLED, FAILED (no further transitions)

---

## 8. SUMMARY & CHECKLIST

### Daily Admin Checklist

**Pagi (09:00):**
- [ ] Check order PAID belum diproses (filter: status=PAID)
- [ ] Process semua PAID → PROCESSING (prioritas: oldest first)
- [ ] Check stock untuk order PROCESSING

**Siang (13:00):**
- [ ] Update PROCESSING → SHIPPED (yang sudah dipacking)
- [ ] Input tracking number untuk semua SHIPPED hari ini
- [ ] Reply customer questions

**Sore (17:00):**
- [ ] Final check: ada PAID yang belum diproses?
- [ ] Check payment PENDING > 6 jam (possible gateway issue)
- [ ] Mark SHIPPED → COMPLETED (yang sudah delivered)

**Mingguan:**
- [ ] Review order SHIPPED > 14 hari (belum COMPLETED)
- [ ] Check FAILED orders trend
- [ ] Report anomaly ke Owner

---

### Safety Checklist

**Sebelum Update Status:**
- [ ] Confirm current status correct
- [ ] Verify next status valid (refer to flow chart)
- [ ] Check payment status match (if applicable)
- [ ] Add notes jika ada info penting

**Sebelum Ship:**
- [ ] Order = PROCESSING ✓
- [ ] Barang sudah dipacking ✓
- [ ] Tracking number ready (if available)
- [ ] Address verified ✓

**Sebelum Mark Completed:**
- [ ] Order = SHIPPED ✓
- [ ] Tracking status = delivered (or 7+ days)
- [ ] No customer complaint ✓

---

**END OF DOCUMENT**

---

**Version:** 1.0  
**Last Updated:** 2025-12-23  
**Status:** 🔒 PRODUCTION READY  
**Maintained By:** Owner / Tech Team

**Prinsip Terakhir:**
> Admin adalah **OPERATOR** sistem, bukan **PENGUBAH** payment.  
> Payment = Gateway authority.  
> Order = Follow payment.  
> Admin = Execute fulfillment only.

---

**Jika ada pertanyaan atau situasi tidak tercakup di dokumen ini:**
→ **STOP** → **ESKALASI** ke Owner
