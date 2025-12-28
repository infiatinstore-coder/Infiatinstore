# 📋 Manual Testing Checklist

**Before Every Deployment**

Last Updated: 22 Desember 2024

---

## 🔐 Authentication Flow

### Registration
- [ ] User dapat register dengan email valid
- [ ] Password harus memenuhi requirement (8 char, uppercase, lowercase, number)
- [ ] Email verification terkirim
- [ ] Duplicate email ditolak
- [ ] Format phone number tervalidasi

### Login
- [ ] User dapat login dengan credentials benar
- [ ] Login gagal dengan password salah
- [ ] Login gagal untuk unverified user
- [ ] JWT token generated dengan benar
- [ ] Session tersimpan di browser

### Password Reset
- [ ] Forgot password email terkirim
- [ ] Reset token valid selama 1 jam
- [ ] Password berhasil direset
- [ ] Old password tidak bisa digunakan lagi

---

## 🛍️ Shopping Flow

### Product Browsing
- [ ] Homepage menampilkan featured products
- [ ] Category filter berfungsi
- [ ] Search menampilkan hasil yang relevan
- [ ] Product detail menampilkan gambar & info lengkap
- [ ] Price range filter berfungsi
- [ ] Sort by price/newest berfungsi

### Cart
- [ ] Add to cart berfungsi
- [ ] Quantity dapat diupdate
- [ ] Remove dari cart berfungsi
- [ ] Cart persistent setelah login/logout
- [ ] Out of stock product tidak bisa ditambah
- [ ] Cart total calculation benar

---

## 💳 Checkout & Payment

### Address
- [ ] User dapat tambah address baru
- [ ] Validasi format postal code & phone
- [ ] Default address tersimpan
- [ ] User dapat edit/delete address

### Shipping
- [ ] RajaOngkir API menampilkan provinces
- [ ] Cities loaded berdasarkan province
- [ ] Shipping cost calculation benar
- [ ] Multiple courier options muncul
- [ ] Estimated delivery time ditampilkan

### Order Creation
- [ ] Order berhasil dibuat dengan data lengkap
- [ ] Order number generated
- [ ] Stock berkurang setelah order
- [ ] Voucher discount applied dengan benar
- [ ] Points dapat digunakan
- [ ] Total calculation benar (subtotal + shipping - discount)

### Payment (Midtrans)
- [ ] Snap token generated
- [ ] Midtrans popup muncul
- [ ] Payment berhasil diproses
- [ ] Webhook received dan verified
- [ ] Order status update ke PAID
- [ ] Email confirmation terkirim

---

## 📦 Order Management

### Customer View
- [ ] Order history ditampilkan
- [ ] Order detail lengkap
- [ ] Tracking number ditampilkan (jika ada)
- [ ] Order status update real-time

### Admin View
- [ ] Dashboard stats accurate
- [ ] Order list lengkap dengan filter
- [ ] Status dapat diupdate
- [ ] Tracking number dapat ditambahkan
- [ ] Email notification terkirim saat status update

---

## ⭐ Reviews & Points

### Reviews
- [ ] User dapat write review setelah order DELIVERED
- [ ] Rating 1-5 berfungsi
- [ ] Image upload berfungsi
- [ ] Review muncul di product page
- [ ] "Helpful" count berfungsi

### Loyalty Points
- [ ] Daily check-in memberikan points
- [ ] Points earned dari purchase
- [ ] Balance calculation benar
- [ ] Redeem points berfungsi
- [ ] Transaction history akurat

---

## 🎯 Promotional Features

### Flash Sale
- [ ] Flash sale ditampilkan jika ada yang active
- [ ] Countdown timer akurat
- [ ] Stock limit enforcement
- [ ] Price discount benar
- [ ] Flash sale berakhir otomatis

### Vouchers
- [ ] Voucher code validation
- [ ] Min purchase check
- [ ] Max discount applied
- [ ] Usage limit enforcement
- [ ] Expired voucher ditolak

### Bundles
- [ ] Bundle pricing calculation benar
- [ ] All products in stock check
- [ ] Bundle discount applied

---

## 👨‍💼 Admin Functions

### Product Management
- [ ] Add product dengan images
- [ ] Edit product (price, stock, description)
- [ ] Delete product
- [ ] Category assignment
- [ ] Featured flag berfungsi

### Analytics
- [ ] Revenue chart accurate
- [ ] Period filter (7d/30d/90d/1y)
- [ ] Growth percentage calculation
- [ ] Best sellers list benar

### Order Processing
- [ ] Filter by status
- [ ] Bulk status update (jika ada)
- [ ] Export orders (jika ada)

---

## 🚨 Error Handling

### Rate Limiting
- [ ] Auth endpoint: 10 req/min limit
- [ ] Payment endpoint: 5 req/min limit
- [ ] Global: 100 req/min limit
- [ ] Retry-After header ditampilkan

### Validation
- [ ] Invalid email format ditolak
- [ ] Missing required fields error clear
- [ ] Price tidak boleh negatif
- [ ] Stock tidak boleh negatif

### Edge Cases
- [ ] Empty search results handled
- [ ] Out of stock product tidak bisa dibeli
- [ ] Expired tokens rejected
- [ ] Simultaneous purchase (race condition)
- [ ] Network timeout handled gracefully

---

## 🔒 Security

### Authentication
- [ ] JWT token expires (check expiry)
- [ ] Unauthorized requests rejected (401)
- [ ] Admin routes protected
- [ ] CSRF protection (jika applicable)

### Input Sanitization
- [ ] XSS prevention di search/review
- [ ] SQL injection prevention (Prisma ORM)
- [ ] File upload validation (type, size)

---

## 📱 Performance

### Load Time
- [ ] Homepage < 3 seconds
- [ ] Product page < 2 seconds
- [ ] Search results < 1 second
- [ ] Cart operations instant

### Caching
- [ ] Product list cached (1 min)
- [ ] Categories cached (10 min)
- [ ] Flash sales cached (30 sec)
- [ ] Cache invalidation saat update

---

## 📧 Email Notifications

### Transactional Emails
- [ ] Registration verification
- [ ] Password reset
- [ ] Order confirmation
- [ ] Payment success
- [ ] Order shipped (dengan tracking)
- [ ] Order delivered
- [ ] Review request (7 days after delivery)
- [ ] Order cancelled

### Admin Emails
- [ ] Low stock alert
- [ ] New order notification

---

## 🤖 Automation

### Cron Jobs
- [ ] Auto-cancel unpaid orders (24 hours)
- [ ] Auto-complete delivered orders (7 days)
- [ ] Low stock check berjalan
- [ ] Email notifications triggered

---

## 💾 Database

### Data Integrity
- [ ] Foreign keys enforced
- [ ] Cascade delete berfungsi
- [ ] Unique constraints (email, slug)
- [ ] Price calculations accurate (Decimal precision)

---

## 🌍 Cross-Browser Testing

- [ ] Chrome (desktop & mobile)
- [ ] Firefox
- [ ] Safari (desktop & mobile)
- [ ] Edge

---

## 📊 Load Testing (Optional)

- [ ] 50 concurrent users
- [ ] 100 concurrent users
- [ ] Database connection pool handling
- [ ] Redis cache effectiveness

---

## ✅ Deployment Checklist

### Environment Variables
- [ ] DATABASE_URL set
- [ ] JWT_SECRET set (strong random)
- [ ] MIDTRANS keys valid
- [ ] RAJAONGKIR_API_KEY valid
- [ ] RESEND_API_KEY valid
- [ ] CLOUDINARY credentials valid
- [ ] SENTRY_DSN set (optional)
- [ ] NODE_ENV=production

### Database
- [ ] Migrations applied
- [ ] Seed data jika perlu
- [ ] Backup strategy setup

### Monitoring
- [ ] Sentry monitoring active
- [ ] Error alerts configured
- [ ] Performance monitoring

---

## 🎯 Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Environment:** [ ] Staging [ ] Production  
**Version:** _______________

**Critical Issues Found:** _______________

**Ready for Deployment:** [ ] Yes [ ] No

---

**Note:** Checklist ini harus di-review setiap sebelum deploy ke production!
