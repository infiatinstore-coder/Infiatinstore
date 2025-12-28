# 🔐 Akun Testing & Demo - Infiatin Store

**Update:** 2025-12-29 02:10 WIB  
**Purpose:** Dokumentasi akun untuk testing dan demo aplikasi

---

## 👥 DAFTAR AKUN YANG TERSEDIA

### 1. SUPER ADMIN (Administrator)
```
📧 Email    : admin@infiatin.store
🔑 Password : admin123
👤 Nama     : Administrator
📱 Phone    : 081234567890
🎭 Role     : SUPER_ADMIN
🔓 Status   : ACTIVE
```

**Akses:**
- ✅ Dashboard Admin lengkap
- ✅ Kelola produk, kategori, orders
- ✅ Kelola users, vouchers, flash sales
- ✅ Lihat analytics & reports
- ✅ Kelola settings
- ❌ **TIDAK BISA checkout** (dinonaktifkan untuk keamanan)

**Cara Login:**
1. Buka https://www.infiya.store/admin
2. Masukkan email: `admin@infiatin.store`
3. Masukkan password: `admin123`
4. Klik "Masuk"

---

### 2. CUSTOMER (Ahmad Wijaya)
```
📧 Email    : customer@infiatin.store
🔑 Password : customer123
👤 Nama     : Ahmad Wijaya
📱 Phone    : 081987654321
🎭 Role     : CUSTOMER
🔓 Status   : ACTIVE
```

**Akses:**
- ✅ Browse products & catalog
- ✅ Add to cart & checkout
- ✅ View order history
- ✅ Manage wishlist
- ✅ Manage addresses
- ✅ View profile & account settings
- ❌ **TIDAK BISA** akses admin dashboard

**Cara Login:**
1. Buka https://www.infiya.store/auth/login
2. Masukkan email: `customer@infiatin.store`
3. Masukkan password: `customer123`
4. Klik "Masuk"

---

## 🚫 AKUN LAMA YANG DIHAPUS

### ~~Demo Customer~~ (DEPRECATED)
```
❌ Email: demo@infiatin.store
❌ Alasan dihapus: Nama tidak profesional, membingungkan
```

**Mengapa dihapus:**
- Nama "Demo Customer" terlihat tidak profesional
- Membingungkan antara akun demo vs real user
- Tidak jelas tujuannya (admin atau customer?)
- Email "demo@" terkesan temporary

**Pengganti:** Gunakan `customer@infiatin.store` dengan nama "Ahmad Wijaya" yang lebih realistis.

---

## 📋 PANDUAN PENGGUNAAN

### Untuk Testing Admin Features:
1. Login sebagai: `admin@infiatin.store`
2. Navigate ke: `/admin`
3. Test CRUD operations untuk products, categories, etc.
4. **JANGAN** test checkout sebagai admin (diblokir for security)

### Untuk Testing Customer Flow:
1. Login sebagai: `customer@infiatin.store`
2. Browse products, add to cart
3. Test checkout process
4. Test order tracking
5. Test profile management

### Untuk Testing Registration:
1. Buat akun baru dengan email asli Anda
2. Verify email (cek inbox)
3. Complete profile
4. Test as real customer

---

## 🔄 RESET DATA (Re-seeding)

Jika data sudah berantakan dari testing, reset dengan:

```bash
# 1. Reset database
npx prisma migrate reset --force

# 2. Re-seed data
npx prisma db seed
```

**PERINGATAN:** Command ini akan **MENGHAPUS SEMUA DATA** dan membuat data fresh dari seed file.

---

## 🎯 BEST PRACTICES

### DO ✅
- Gunakan `admin@infiatin.store` untuk test admin features
- Gunakan `customer@infiatin.store` untuk test customer flow
- Buat dokumentasi jika menambah akun testing baru
- Gunakan password yang jelas untuk testing (tapi BEDA dari production!)

### DON'T ❌
- Jangan share password production di seed file
- Jangan test checkout sebagai admin
- Jangan hapus seed users di production
- Jangan gunakan nama "Demo" atau "Test" di production

---

## 🔐 SECURITY NOTES

### Development vs Production:

**Development (.env.local):**
```env
# OK untuk testing
DEFAULT_ADMIN_EMAIL=admin@infiatin.store
DEFAULT_ADMIN_PASSWORD=admin123
```

**Production (.env di Vercel):**
```env
# HARUS GANTI password yang strong!
DEFAULT_ADMIN_EMAIL=admin@infiatin.store
DEFAULT_ADMIN_PASSWORD=<USE_STRONG_PASSWORD_HERE>
```

### Password Security:
1. **Development:** Simple password OK (admin123, customer123)
2. **Production:** HARUS ganti dengan password kuat minimal 12 karakter
3. **Never** commit real production passwords ke Git

---

## 📝 CHANGELOG

### 2025-12-29
- ✅ UPDATE: Ganti nama admin dari "Admin Infiatin Store" → "Administrator"
- ✅ REMOVE: Hapus akun `demo@infiatin.store` (deprecated)
- ✅ ADD: Akun customer baru `customer@infiatin.store` dengan nama "Ahmad Wijaya"
- ✅ UPDATE: Password customer dari `password123` → `customer123` (lebih jelas)
- ✅ ADD: Dokumentasi lengkap akun testing

### Alasan Changes:
User complaint: *"mana admin mana demo tidak jelas namanya"*
- Nama "Demo Customer" membingungkan
- Email "demo@" tidak profesional
- Perlu distinction yang jelas antara admin vs customer

---

## 🎨 UI/UX CONSIDERATIONS

### Profile Page Display:
```
SEBELUM (MEMBINGUNGKAN):
- Header: "Admin" (misleading - ini bukan role, cuma tombol)
- Name: "Demo Customer" (unprofessional)
- Email: demo@infiatin.store (temporary-looking)

SESUDAH (CLEAR):
- Header: Account info dengan role badge yang jelas
- Name: "Administrator" (untuk admin) atau "Ahmad Wijaya" (untuk customer)
- Email: admin@ atau customer@ (clear purpose)
```

---

## 💡 RECOMMENDATION

Untuk production, consider:

1. **Hapus/disable semua test accounts** di production
2. **Buat admin account** dengan detail real:
   - Email: email real admin
   - Password: strong password (gunakan password manager)
   - 2FA enabled (if implemented)
3. **Monitor** failed login attempts
4. **Audit** admin actions regularly

---

*Dokumentasi ini dibuat untuk mengatasi confusion tentang user testing yang tidak jelas penamaan dan purpose-nya.*
