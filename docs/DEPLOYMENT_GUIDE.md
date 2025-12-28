# 🚀 Free Tier Deployment Guide

**Stack:** Neon + Vercel + Cloudflare (100% GRATIS)  
**Estimasi Waktu:** 30-45 menit

---

## 📋 Prerequisites

Sebelum mulai, pastikan Anda punya:

- [ ] Akun GitHub (gratis)
- [ ] Email aktif untuk signup services

---

## Step 1: Setup Neon Database (10 menit)

### 1.1 Buat Akun Neon

1. Buka <https://neon.tech>
2. Klik **Sign Up** → **Continue with GitHub**
3. Authorize Neon

### 1.2 Buat Project

1. Klik **New Project**
2. Isi:
   - **Project name:** `infiya-store`
   - **Region:** Singapore (closest to Indonesia)
   - **Postgres version:** 16
3. Klik **Create Project**

### 1.3 Copy Connection String

1. Di dashboard, klik **Connection Details**
2. Copy **Connection string** (pooled)

   ```
   postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/infiya_store?sslmode=require
   ```

3. **SIMPAN INI!** Akan dipakai di Vercel

### 1.4 Update .env.local

```bash
# Ganti DATABASE_URL dengan Neon connection string
DATABASE_URL="postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/infiya_store?sslmode=require"
```

### 1.5 Push Schema ke Neon

```bash
npx prisma db push
npx prisma db seed
```

---

## Step 2: Push ke GitHub (5 menit)

### 2.1 Pastikan .gitignore benar

File `.env` dan `.env.local` TIDAK boleh di-push!

### 2.2 Push code

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

---

## Step 3: Deploy ke Vercel (10 menit)

### 3.1 Buat Akun Vercel

1. Buka <https://vercel.com>
2. Klik **Sign Up** → **Continue with GitHub**
3. Authorize Vercel

### 3.2 Import Project

1. Klik **Add New** → **Project**
2. Pilih repository `infiya-store` (atau nama repo Anda)
3. Klik **Import**

### 3.3 Configure Environment Variables

Di halaman configure, tambahkan **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (dari Neon tadi) |
| `JWT_SECRET` | (generate random: `openssl rand -base64 32`) |
| `MIDTRANS_SERVER_KEY` | (dari dashboard Midtrans) |
| `MIDTRANS_CLIENT_KEY` | (dari dashboard Midtrans) |
| `MIDTRANS_IS_PRODUCTION` | `false` (atau `true` untuk production) |
| `NEXT_PUBLIC_API_URL` | `https://your-app.vercel.app` |

### 3.4 Deploy

1. Klik **Deploy**
2. Tunggu ~2-3 menit
3. Setelah selesai, klik URL yang diberikan

---

## Step 4: Test Production (5 menit)

### 4.1 Test Health Endpoint

```
https://your-app.vercel.app/api/health
```

Harus return `"status": "healthy"`

### 4.2 Test Homepage

Buka URL dan pastikan:

- [ ] Homepage load dengan benar
- [ ] Produk muncul
- [ ] Bisa register/login
- [ ] Bisa add to cart

### 4.3 Test Order Flow

1. Login with demo account
2. Add product to cart
3. Checkout sampai payment page
4. Verify order tercreate di database

---

## Step 5: Setup Custom Domain (Optional)

### 5.1 Di Vercel

1. Go to Project → **Settings** → **Domains**
2. Add your domain: `infiya.store`
3. Follow DNS instructions

### 5.2 Di Cloudflare (Recommended)

1. Buka <https://cloudflare.com>
2. Add your domain
3. Update nameservers di registrar
4. Enable:
   - SSL/TLS: Full (strict)
   - Always Use HTTPS
   - Auto Minify

---

## 🎉 Free Tier Limits

| Service | Limit | Cukup untuk |
|---------|-------|-------------|
| **Vercel** | 100GB bandwidth/bulan | ~10,000 visitors |
| **Neon** | 0.5GB storage | ~50,000 orders |
| **Cloudflare** | Unlimited | ∞ |

**Auto-sleep Neon:** Database akan sleep setelah 5 menit idle. First request akan lambat (~2 detik). Ini normal untuk free tier.

---

## ⚠️ Troubleshooting

### Error: Database connection failed

- Pastikan DATABASE_URL benar (include `?sslmode=require`)
- Cek Neon dashboard apakah project aktif

### Error: Build failed

- Cek Vercel logs untuk error spesifik
- Pastikan semua env vars sudah diset

### Slow first request

- Normal karena Neon auto-sleep
- Untuk menghilangkan: upgrade ke paid ($25/bulan)

---

## 📞 Next Steps After Deploy

1. **Monitor:** Cek Vercel Analytics untuk traffic
2. **Errors:** Setup Sentry untuk error tracking
3. **Backup:** Neon auto-backup setiap 24 jam (free tier)

---

**Setelah selesai, reply dengan URL production Anda!** 🚀
