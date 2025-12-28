## 🔐 KREDENSIAL LOGIN INFIATIN STORE

### Admin / Super Admin
```
Email    : admin@infiatin.store
Password : admin123
Role     : SUPER_ADMIN
```

### Demo Customer
```
Email    : demo@infiatin.store
Password : password123
Role     : CUSTOMER
```

---

## 📌 Catatan Penting

1. **Ganti Password Setelah Login Pertama**
   - Segera ganti password default untuk keamanan
   - Akses: Admin Dashboard → Settings → Security

2. **Jika Lupa Password**
   ```bash
   # Jalankan seed ulang untuk reset ke password default
   npx prisma db seed
   ```

3. **Environment Production**
   - **WAJIB** ganti password sebelum deploy ke production
   - Jangan gunakan password default `admin123` di production

4. **Login URL**
   - Admin: `http://localhost:3000/admin/login` (Halaman khusus admin)
   - Customer: `http://localhost:3000/auth/login`
   - Dashboard Admin: `http://localhost:3000/admin`

---

## 🔧 Troubleshooting Login

### Password Selalu Salah?

**Solusi 1: Reset Database**
```bash
npx prisma db push --force-reset
npx prisma db seed
```

**Solusi 2: Cek Typo**
- Email: `admin@infiatin.store` (bukan `admin@infiya.store`)
- Password: `admin123` (case sensitive, lowercase semua)

**Solusi 3: Clear Browser Cache**
- Hapus cookies dan cache browser
- Coba di incognito/private mode

### Akun Suspended?

Jika muncul error "Akun dinonaktifkan":
```bash
# Jalankan di Prisma Studio atau seed ulang
npx prisma studio
# Ubah status user menjadi ACTIVE
```

---

## 📝 Cara Membuat Admin Baru

Opsi 1 - Via Prisma Studio (Recommended):
```bash
npx prisma studio
```
1. Buka tabel `User`
2. Klik "Add record"
3. Isi data:
   - email: `admin2@infiatin.store`
   - passwordHash: (hash bcrypt password)
   - role: `ADMIN` atau `SUPER_ADMIN`
   - status: `ACTIVE`

Opsi 2 - Via Script:
```javascript
// Jalankan di Node.js atau buat script
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('yourpassword', 10);
console.log(hash); // Copy hash ini ke passwordHash
```

---

**Terakhir Update**: 27 Desember 2025
