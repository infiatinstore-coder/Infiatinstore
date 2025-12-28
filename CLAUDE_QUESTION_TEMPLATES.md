# 📋 TEMPLATE PERTANYAAN UNTUK CLAUDE.AI
**Project**: Infiatin Store E-commerce
**Purpose**: Lengkapi fitur production-grade yang masih kurang

---

## TEMPLATE 1: RETURN & REFUND MANAGEMENT

```
Context:
Saya sedang membangun e-commerce production-ready dengan Next.js + Prisma + PostgreSQL.

Yang sudah ada:
- Order state machine lengkap (PENDING → PAID → SHIPPED → DELIVERED → COMPLETED)
- Payment webhook idempotency
- Escrow system (hold 7 hari, auto-release)
- Dispute system (database ready, logic belum)

Yang saya butuhkan:
Comprehensive Return & Refund Management System untuk production e-commerce Indonesia.

Pertanyaan:
1. Database Schema:
   - Table apa saja yang diperlukan untuk RMA (Return Merchandise Authorization)?
   - Bagaimana track return shipping?
   - Status flow untuk return/refund?

2. Business Logic:
   - Kapan user bisa request return? (7 hari setelah delivered?)
   - Bagaimana handle partial refund vs full refund?
   - Logic restocking setelah barang returned?
   - Integrasi dengan escrow system yang sudah ada?

3. Implementation:
   - returnManager.js (core logic)
   - Integration dengan order state machine
   - API endpoints untuk return flow
   - Admin approval workflow

4. Edge Cases:
   - Bagaimana kalau escrow sudah released?
   - Refund via payment gateway vs store credit?
   - Return fraud prevention?

Expected deliverables:
- Prisma schema untuk return/refund
- returnManager.js dengan fungsi lengkap
- Integration hooks ke existing order flow
- Admin dashboard logic untuk approve/reject return

Format jawaban: 
Tolong berikan code yang production-ready dengan best practices dari Tokopedia/Shopee.
```

---

## TEMPLATE 2: ADMIN ANALYTICS DASHBOARD

```
Context:
E-commerce Next.js sudah running dengan:
- Order management complete
- Payment tracking
- Inventory system
- Affiliate commission

Yang belum ada:
Admin Dashboard untuk monitoring business metrics.

Pertanyaan:
1. Database Schema:
   - Apakah perlu table khusus untuk analytics cache?
   - Atau direct query dari existing tables?
   - Daily/monthly aggregation tables?

2. Metrics yang Penting:
   - Sales metrics apa yang critical? (GMV, AOV, conversion rate?)
   - Inventory alerts (low stock, overstock)
   - Customer metrics (LTV, repeat purchase rate)
   - Seller performance (untuk marketplace)

3. Implementation:
   - analyticsService.js untuk calculation logic
   - Caching strategy (Redis atau database?)
   - Real-time vs batch processing?
   - Dashboard API endpoints

4. Visualization:
   - Rekomendasi library untuk charts? (Recharts? Chart.js?)
   - Sample dashboard layout/structure?

Expected deliverables:
- Schema untuk analytics (jika perlu)
- analyticsService.js dengan fungsi calculate metrics
- API endpoints untuk dashboard data
- Sample dashboard queries (SQL/Prisma)

Tech stack: Next.js 15, Prisma, PostgreSQL, (Tailwind untuk UI)
```

---

## TEMPLATE 3: FRAUD DETECTION & PREVENTION

```
Context:
E-commerce production dengan payment integration (Midtrans).

Current security:
- Basic audit logging (user actions)
- Webhook signature verification
- Order state machine validation

Yang butuh ditambahkan:
Fraud detection system untuk prevent loss dari fraudster.

Pertanyaan:
1. Database Schema:
   - Table untuk track suspicious activities?
   - IP blacklist management?
   - User risk score tracking?

2. Detection Patterns:
   - Bagaimana detect bulk order fraud?
   - Multiple failed payment attempts?
   - Fake review detection?
   - Promo code abuse?
   - Unusual shipping patterns?

3. Implementation:
   - fraudDetectionService.js
   - Real-time checks vs batch analysis?
   - Integration points (checkout, payment, review)
   - Auto-block vs manual review workflow?

4. Response Actions:
   - Require additional verification (OTP, ID upload)?
   - Temporary account suspension?
   - Order hold for manual review?
   - Notify admin via email/WhatsApp?

Expected deliverables:
- Fraud detection schema
- fraudDetectionService.js dengan detection logic
- Integration hooks ke checkout & payment flow
- Admin dashboard untuk review suspicious orders

Format: Production-grade code dengan real-world fraud patterns dari marketplace Indonesia.
```

---

## TEMPLATE 4: TAX & INVOICE GENERATION

```
Context:
E-commerce Indonesia butuh compliance dengan regulasi pajak.

Current order flow:
- Order → Payment → Shipping → Delivery
- Order memiliki: order_number, total, items, buyer info

Yang butuh ditambahkan:
Tax calculation (PPN 11%) dan Invoice generation system.

Pertanyaan:
1. Tax Calculation:
   - Apakah semua produk kena PPN 11%?
   - Bagaimana handle tax-exempt products?
   - Store info di order atau calculate on-the-fly?
   - Integrasi dengan existing order total calculation?

2. Invoice Generation:
   - Format Faktur Pajak Indonesia yang benar?
   - PDF generation (library recommendation: PDFKit? Puppeteer?)
   - Invoice numbering system (INV-2024-0001)?
   - Invoice storage (database + S3/Cloudinary?)

3. Implementation:
   - taxCalculator.js
   - invoiceGenerator.js
   - Integration ke order confirmation flow
   - Email invoice otomatis setelah payment

4. Compliance:
   - NPWP seller tracking?
   - Monthly tax report generation?
   - Invoice correction/cancellation?

Expected deliverables:
- Tax calculation logic
- Invoice generation service (with PDF)
- Sample invoice template (Indonesia format)
- API endpoints untuk download/email invoice

Tech: Next.js, Prisma, prefer library yang simple untuk PDF generation.
```

---

## TEMPLATE 5: REAL-TIME NOTIFICATIONS (BONUS)

```
Context:
E-commerce dengan order flow complete, tapi notification masih via email only.

Current notification:
- Email queue system (order confirmation, payment reminder)
- WhatsApp integration (via n8n webhook)

Yang butuh ditambahkan:
Real-time in-app notification system.

Pertanyaan:
1. Architecture Choice:
   - WebSocket vs Server-Sent Events (SSE)?
   - Mana yang lebih cocok untuk Next.js + Vercel?
   - Scaling considerations?

2. Database Schema:
   - Table notifications dengan user_id, type, is_read?
   - Notification preferences per user?
   - Retention policy (auto-delete after 30 days?)

3. Implementation:
   - notificationService.js (create, mark as read, delete)
   - Real-time connection management
   - Integration points (order status change, payment, shipping)
   - Bell icon with unread count (frontend)

4. Notification Types:
   - Order status updates
   - Payment confirmation
   - Shipping updates
   - Promo/marketing (opt-in)
   - Low stock alerts (sellers)

Expected deliverables:
- Notification schema
- Backend service (WebSocket/SSE setup)
- notificationService.js dengan CRUD operations
- API endpoints untuk real-time connection
- Sample frontend component (bell icon)

Tech: Next.js 15 App Router, Prisma, simple solution untuk Vercel deployment.
```

---

## 📝 USAGE INSTRUCTIONS

**Cara pakai**:
1. Copy salah satu template diatas
2. Paste ke chat dengan Claude.ai
3. Claude akan jawab dengan detail implementation
4. Share hasil Claude ke saya
5. Saya implement code-nya di project Anda

**Urutan rekomendasi**:
1. **Template 1** (Return & Refund) - Critical untuk customer trust
2. **Template 4** (Tax & Invoice) - Legal compliance
3. **Template 2** (Analytics) - Business intelligence
4. **Template 3** (Fraud Detection) - Protect dari loss
5. **Template 5** (Real-time Notif) - Better UX

**Tips**:
- Tanyakan 1-2 template per session ke Claude
- Jangan sekaligus 5, nanti jawabannya terlalu panjang
- Setelah dapat jawaban, share ke saya untuk implementasi

---

**File ini**: `CLAUDE_QUESTION_TEMPLATES.md`
**Ready to copy-paste!** 📋
