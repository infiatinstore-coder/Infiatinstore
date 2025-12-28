# 📦 infiya.store - Project Overview

**Last Updated:** 22 Desember 2024  
**Project Status:** ~60-70% Complete

---

## 🎯 Apa Proyek Ini?

**infiya.store** adalah platform **E-Commerce Single-Vendor** (toko tunggal) yang dibangun untuk menjadi marketplace modern dan profesional. Berbeda dengan marketplace multi-vendor seperti Tokopedia/Shopee, infiya.store adalah toko tunggal di mana semua produk dijual langsung oleh pemilik toko.

### Tujuan Utama (Goals)

| Goal | Deskripsi |
|------|-----------|
| 🛒 **E-Commerce Lengkap** | Platform toko online dengan semua fitur standar: katalog produk, keranjang, checkout, pembayaran, pengiriman |
| 💳 **Pembayaran Terintegrasi** | Integrasi dengan Midtrans payment gateway untuk berbagai metode pembayaran |
| 📦 **Manajemen Order** | Sistem order management lengkap dari pemesanan hingga pengiriman |
| 👤 **Multi-Role** | Customer, Admin, dan Super Admin dengan akses berbeda |
| 🎯 **SEO-Ready** | Optimized untuk search engine dengan sitemap, robots.txt, meta tags |
| 📱 **Responsive** | Mobile-first design yang bekerja di semua device |

---

## 🏗️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│  Next.js 15.1 + React 19 + Tailwind CSS 3.4             │
│  Zustand (State) + Lucide React (Icons)                 │
├─────────────────────────────────────────────────────────┤
│                    BACKEND                               │
│  Next.js API Routes + Prisma ORM                        │
│  JWT Auth (jose) + bcryptjs (Password Hashing)          │
├─────────────────────────────────────────────────────────┤
│                    DATABASE                              │
│  PostgreSQL (via Prisma)                                │
├─────────────────────────────────────────────────────────┤
│                 PAYMENT GATEWAY                          │
│  Midtrans (midtrans-client)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Statistik Proyek

| Metric | Count |
|--------|-------|
| Database Models | 19 models |
| API Endpoints | 25+ endpoints |
| Frontend Pages | 44+ pages |
| UI Components | 14+ components |
| Lines of Schema | 522 lines |

---

## ✅ Fitur yang Sudah Diimplementasikan

### 1. 🔐 Autentikasi & Otorisasi
- Login/Register dengan JWT
- Role-based access: CUSTOMER, ADMIN, SUPER_ADMIN
- Middleware protection untuk routes
- Password hashing dengan bcrypt

### 2. 🛍️ Katalog Produk
- Produk dengan kategori hierarki (parent-child)
- Varian produk (size, color, dll)
- Gambar multiple, SEO metadata
- Status: ACTIVE, INACTIVE, SOLD_OUT, ARCHIVED
- Featured products/Best sellers

### 3. 🛒 Shopping Cart
- Add/remove/update items
- Support untuk guest cart (session-based)
- Cart drawer (slide-out)
- Quantity management

### 4. 📦 Order Management
- Complete order workflow:
  ```
  PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED → COMPLETED
  ```
- Order number auto-generate
- Price snapshot (harga saat beli disimpan)
- PPN 11% calculation

### 5. 💳 Payment System
- **Midtrans integration** (Snap)
- Multiple payment methods
- Payment status tracking
- Webhook handling untuk callback

### 6. 🚚 Shipping & Fulfillment
- Tracking number management
- Multiple courier support (JNE, SiCepat, GoSend)
- Shipment status workflow

### 7. 🔄 Refund & Return
- Request refund dengan bukti
- Status workflow lengkap
- Admin approval system

### 8. 🎟️ Voucher & Promo
- PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
- Min purchase, max discount
- Usage limit & tracking

### 9. ⭐ Review & Rating
- 1-5 star rating
- Review dengan foto
- "Helpful" voting system
- Moderasi oleh admin

### 10. 📍 Address Management
- Multiple addresses per user
- Default address flag
- Labels: HOME, OFFICE, OTHER

### 11. Fitur Lainnya
- 🔔 Notification system
- ❤️ Wishlist
- 📰 Newsletter subscription
- 📧 Contact form
- 📊 Admin dashboard dengan statistik
- 🔍 Activity logging

---

## 🗂️ Struktur Database (19 Models)

```
┌───────────────────────────────────────────────────────┐
│ USER & AUTH                                           │
├───────────────────────────────────────────────────────┤
│ User, Address                                         │
├───────────────────────────────────────────────────────┤
│ PRODUCT                                               │
├───────────────────────────────────────────────────────┤
│ Category, Product, ProductVariant                     │
├───────────────────────────────────────────────────────┤
│ COMMERCE                                              │
├───────────────────────────────────────────────────────┤
│ Cart, Order, OrderItem, Payment, Shipment, Refund     │
├───────────────────────────────────────────────────────┤
│ ENGAGEMENT                                            │
├───────────────────────────────────────────────────────┤
│ Review, ReviewHelpful, Wishlist, Notification         │
├───────────────────────────────────────────────────────┤
│ MARKETING                                             │
├───────────────────────────────────────────────────────┤
│ Voucher, NewsletterSubscriber                         │
├───────────────────────────────────────────────────────┤
│ SUPPORT                                               │
├───────────────────────────────────────────────────────┤
│ ContactMessage, ActivityLog                           │
└───────────────────────────────────────────────────────┘
```

---

## 🛣️ API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout

### Products & Categories
- `GET /api/products` - List products
- `GET /api/products/[slug]` - Product detail
- `GET /api/categories` - List categories

### Cart
- `GET/POST/PUT/DELETE /api/cart` - CRUD cart

### Orders
- `GET/POST /api/orders` - Orders
- `PUT /api/orders/[id]` - Update status

### Payment
- `POST /api/payment/create` - Create payment
- `POST /api/payment/webhook` - Midtrans callback

### Others
- Reviews, Addresses, Vouchers, Newsletter, Contact

---

## 📱 Halaman Frontend

### Public (14 pages)
- `/` - Homepage
- `/products`, `/products/[slug]` - Catalog
- `/cart`, `/checkout` - Shopping
- `/about`, `/contact`, `/help` - Info
- `/privacy`, `/terms`, `/refund-policy` - Legal
- `/auth/login`, `/auth/register` - Auth

### User Account (4 pages)
- `/account` - Dashboard
- `/account/orders`, `/account/addresses`, `/account/settings`

### Admin (10+ pages)
- `/admin` - Dashboard dengan statistik
- `/admin/orders`, `/admin/products`, `/admin/customers`
- `/admin/vouchers`, `/admin/refunds`, `/admin/newsletter`
- `/admin/messages`, `/admin/settings`

---

## 🎨 Homepage Sections

1. **Hero Section** - CTA utama, trust stats, floating badges
2. **Trust Badges** - 100% Original, Gratis Ongkir, Easy Return, CS 24/7
3. **Categories** - Grid kategori dengan gambar
4. **Featured Products** - Best seller minggu ini
5. **All Products** - Koleksi lengkap
6. **Newsletter** - Email subscription

---

## 📋 Yang Masih Perlu Dikerjakan

| Area | Status | Priority |
|------|--------|----------|
| Email verification | ❌ Belum | High |
| Forgot password | ❌ Belum | High |
| Real shipping API (RajaOngkir) | ❌ Belum | Medium |
| Image upload to cloud | ❌ Belum | Medium |
| WhatsApp notifications | ❌ Belum | Low |
| Loyalty points | ❌ Belum | Low |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Seed data (optional)
npx prisma db seed

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📁 Dokumentasi Lainnya

- [dokumentasi_lengkap.md](./dokumentasi_lengkap.md) - Dokumentasi teknis lengkap
- [MIDTRANS_SETUP.md](./MIDTRANS_SETUP.md) - Setup payment gateway
- [GIT_SETUP.md](./GIT_SETUP.md) - Git configuration

---

**Built with ❤️ using Next.js 15 + React 19 + Prisma + PostgreSQL**
