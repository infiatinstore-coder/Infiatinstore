# FEATURE ADMISSION RULES
**Project:** infiya.store  
**Type:** Feature Gate & Admission Control  
**Version:** 1.0  
**Date:** 2025-12-23  
**Status:** 🔒 LOCKED - GOVERNANCE POLICY  

---

## PRINSIP UTAMA

Dokumen ini adalah **GERBANG RESMI** untuk semua fitur baru yang ingin masuk ke infiya.store.

**Tujuan:**
- Melindungi sistem inti (ORDER & PAYMENT) dari degradasi
- Memastikan setiap fitur baru tidak merusak yang sudah jalan
- Menjaga kualitas production-grade
- Mencegah technical debt yang tidak perlu

**Filosofi:**
> **"NO" is the default. "YES" requires proof of safety.**  
> Setiap fitur baru adalah SUSPECT sampai terbukti AMAN.

**Prinsip Keras:**
1. ✅ **Core stability > New features** - Sistem yang jalan lebih penting dari fitur baru
2. ✅ **Documented rules > Ad-hoc decisions** - Semua harus tertulis
3. ✅ **Production safety > Development speed** - Lambat tapi aman
4. ✅ **Reject by default > Accept by exception** - Tolak dulu, terima kalau terbukti layak

---

## 1. KLASIFIKASI FITUR

Semua fitur masuk salah satu dari 3 kategori:

### 1.1 CORE FEATURES (Auto-Approve)

**Definisi:**  
Fitur yang memperbaiki atau memperkuat sistem inti tanpa mengubah business logic.

**Kriteria:**
- ✅ Bug fix di flow existing
- ✅ Performance optimization tanpa mengubah behavior
- ✅ Security patch
- ✅ Monitoring & logging enhancement
- ✅ Error handling improvement

**Contoh CORE Features:**
1. **Database query optimization**
   - Boleh: Tambah index untuk speed
   - Alasan: Tidak mengubah logic, hanya performance

2. **Rate limiting adjustment**
   - Boleh: Ubah 5 req/min → 10 req/min
   - Alasan: Masih protective, tidak mengubah flow

3. **Add logging untuk debug**
   - Boleh: Log setiap payment webhook
   - Alasan: Tidak mengubah behavior, hanya visibility

4. **Error message improvement**
   - Boleh: Message lebih detail
   - Alasan: User experience, tidak ada side effect

**Syarat Masuk:**
- Tidak mengubah database schema (kecuali add index)
- Tidak mengubah API contract
- Tidak mengubah state machine
- Pass existing tests (kalau ada)

**Review Time:** 15 menit (quick check)

---

### 1.2 EXTENSION FEATURES (Conditional-Approve)

**Definisi:**  
Fitur baru yang menambah fungsionalitas tapi tidak menyentuh ORDER/PAYMENT core logic.

**Kriteria:**
- ⚠️ Adds new functionality (non-critical)
- ⚠️ Might add new database tables (isolated)
- ⚠️ Might add new API endpoints
- ⚠️ Does NOT change existing order/payment flow
- ⚠️ Has clear isolation boundary

**Contoh EXTENSION Features:**

| Feature | Status | Reason | Requirements |
|---------|--------|--------|--------------|
| **Wishlist** | ✅ ALLOWED | Isolated dari order, pure read | New table OK, no order impact |
| **Product Reviews** | ✅ ALLOWED | Tidak mengubah checkout flow | Require order COMPLETED |
| **Newsletter Subscribe** | ✅ ALLOWED | Totally independent | Email service only |
| **Search Filter Advanced** | ✅ ALLOWED | Read-only, no mutations | Performance tested |
| **Chat Support** | ✅ ALLOWED | Isolated feature | No database lock contention |
| **Loyalty Points (Read)** | ✅ ALLOWED | Display saja, no redeem yet | No order price change |
| **Product Recommendations** | ✅ ALLOWED | Algorithm layer, read-only | Cached, no slow queries |

**Syarat Masuk (WAJIB SEMUA):**

1. **Isolation Proof**
   - Fitur berjalan di table/module terpisah
   - Failure di fitur baru tidak crash existing flow
   - Can be disabled without breaking core

2. **Performance Proof**
   - Query < 100ms (average)
   - No full table scan
   - Has proper indexes

3. **Documentation**
   - FEATURE_NAME_RULES.md created
   - API documentation
   - Database schema explained

4. **Testing**
   - Unit test coverage > 50%
   - Integration test dengan existing flow
   - Load test (jika relevant)

5. **Rollback Plan**
   - Can be disabled via feature flag
   - Can be removed without migration pain
   - No data dependency dari core tables

**Review Time:** 2-4 hours (thorough review)

---

### 1.3 FORBIDDEN FEATURES (Auto-Reject)

**Definisi:**  
Fitur yang menyentuh ORDER/PAYMENT core logic atau menambah risiko finansial/legal.

**Kriteria (ANY = FORBIDDEN):**
- ❌ Mengubah order status flow
- ❌ Mengubah payment verification logic
- ❌ Mengubah stock reduction logic
- ❌ Mengubah pricing calculation
- ❌ Bypass guards yang sudah ada
- ❌ Add admin override untuk payment
- ❌ Menambah state baru ke OrderStatus
- ❌ Menambah state baru ke PaymentStatus

**Contoh FORBIDDEN Features:**

| Feature | Status | Reason | Risk |
|---------|--------|--------|------|
| **Instant Refund** | ❌ FORBIDDEN | Touches payment flow, adds REFUND state | Financial risk, requires escrow |
| **Manual Mark as PAID** | ❌ FORBIDDEN | Bypasses payment verification | Fraud risk, violates ORDER_PAYMENT_RULES |
| **Cancel PAID Order** | ❌ FORBIDDEN | Violates state machine rules | Already locked in ADMIN_OPERATION_FLOW |
| **Promo Stacking** | ❌ FORBIDDEN | Complex pricing calculation | Race condition, audit nightmare |
| **Split Payment** | ❌ FORBIDDEN | Adds payment complexity | Out of scope, financial risk |
| **Partial Stock Reserve** | ❌ FORBIDDEN | Changes stock logic significantly | Race condition, overselling risk |
| **Edit Order After PAID** | ❌ FORBIDDEN | Violates immutability rule | Audit trail corruption |
| **Multi-Currency** | ❌ FORBIDDEN | Changes pricing & payment | Accounting complexity, legal |
| **Buy Now Pay Later** | ❌ FORBIDDEN | Credit system, payment risk | Out of scope, financial license |
| **Flash Sale during Checkout** | ❌ FORBIDDEN | Price change mid-checkout | User confusion, legal risk |

**Penolakan Permanen:**

Beberapa fitur TIDAK AKAN PERNAH masuk karena fundamentally incompatible:

1. **Automatic Refund**
   - Why: Payment gateway tidak support auto-refund safe
   - Alternative: Manual refund via gateway dashboard

2. **Admin Override Payment Status**
   - Why: Violates ORDER_PAYMENT_RULES.md section 6.3
   - Alternative: Manual verification, then webhook replay

3. **Dynamic Pricing During Checkout**
   - Why: Order total must be locked at order creation
   - Alternative: Flash sale ends before checkout starts

4. **Negative Stock Allowed**
   - Why: Overselling prevention is core safety
   - Alternative: Backorder system (separate table)

5. **Delete Order Permanently**
   - Why: Audit requirement, legal compliance
   - Alternative: Soft delete (status = ARCHIVED)

---

## 2. SYARAT WAJIB FITUR BARU

Setiap fitur baru WAJIB menjawab **5 PERTANYAAN KRITIS:**

### Checklist Evaluasi Fitur:

```
[ ] 1. Apakah fitur ini menyentuh ORDER?
    - Order creation flow
    - Order status transition
    - Order pricing calculation
    - Order cancellation

[ ] 2. Apakah fitur ini menyentuh PAYMENT?
    - Payment creation
    - Payment verification
    - Payment status update
    - Refund/void processing

[ ] 3. Apakah fitur ini menambah STATE baru?
    - New OrderStatus value
    - New PaymentStatus value
    - New transition path

[ ] 4. Apakah fitur ini butuh admin override?
    - Bypass guards
    - Manual status change
    - Edit immutable data

[ ] 5. Apakah fitur ini menambah risiko finansial?
    - Money handling
    - Pricing logic
    - Stock manipulation
    - Discount calculation
```

**Scoring:**

| Score | Category | Action |
|-------|----------|--------|
| 0 YES | CORE or EXTENSION | Fast-track review |
| 1 YES | EXTENSION | Careful review required |
| 2 YES | HIGH RISK | Deep review + rules document |
| 3+ YES | FORBIDDEN | **REJECT** |

**Examples:**

**Example 1: Wishlist**
```
[ ] 1. Menyentuh ORDER? NO (read-only, no checkout change)
[ ] 2. Menyentuh PAYMENT? NO (totally separate)
[ ] 3. Menambah STATE? NO (own table, own status)
[ ] 4. Butuh admin override? NO (user-controlled)
[ ] 5. Risiko finansial? NO (no money involved)

Score: 0 YES
Category: EXTENSION
Decision: ✅ APPROVED (with documentation)
```

**Example 2: Loyalty Points Redemption**
```
[x] 1. Menyentuh ORDER? YES (affects final price)
[ ] 2. Menyentuh PAYMENT? NO (happens before payment)
[ ] 3. Menambah STATE? NO (uses existing discount field)
[ ] 4. Butuh admin override? NO (automated)
[x] 5. Risiko finansial? YES (reduces revenue)

Score: 2 YES
Category: HIGH RISK
Decision: ⚠️ CONDITIONAL (Requires LOYALTY_REDEMPTION_RULES.md)

Requirements:
- Points cannot change after order created
- Points deduction must be atomic with order creation
- Points restore if order CANCELLED from PENDING_PAYMENT
- Max redemption limit (e.g., 50% of order total)
- Audit log every redemption
```

**Example 3: Instant Refund**
```
[x] 1. Menyentuh ORDER? YES (status → REFUNDED)
[x] 2. Menyentuh PAYMENT? YES (create refund transaction)
[x] 3. Menambah STATE? YES (REFUNDED already deprecated)
[x] 4. Butuh admin override? YES (approve refund)
[x] 5. Risiko finansial? YES (money out)

Score: 5 YES
Category: FORBIDDEN
Decision: ❌ REJECTED

Reason: 
- Touches all core systems
- Adds financial risk
- Requires escrow account
- Out of scope (ORDER_PAYMENT_RULES section 11)
- Alternative: Manual refund via gateway
```

---

## 3. ATURAN PENOLAKAN FITUR

### 3.1 Auto-Reject Conditions

Fitur HARUS DITOLAK jika memenuhi salah satu:

1. **Violates Locked Rules**
   - Contradicts ORDER_PAYMENT_RULES.md
   - Contradicts ADMIN_OPERATION_FLOW.md
   - Breaks PRODUCTION_GUARD.md safety measures

2. **Requires State Machine Change**
   - Adds new OrderStatus (beyond FAILED)
   - Adds new PaymentStatus
   - Changes VALID_TRANSITIONS

3. **Bypasses Guards**
   - Removes payment verification
   - Removes stock locking
   - Removes idempotency check

4. **Financial Risk Without Mitigation**
   - Real money movement without audit
   - Pricing calculation without lock
   - Discount without limit

5. **Legal/Compliance Risk**
   - Payment data storage (PCI-DSS)
   - Personal data processing (GDPR)
   - Tax calculation (requires accountant)

### 3.2 Reject Dengan Penjelasan

**Format Penolakan:**
```
Feature: [NAME]
Status: REJECTED
Reason: [PRIMARY REASON]
Risk Category: [FINANCIAL/LEGAL/TECHNICAL/SECURITY]

Explanation:
[Detailed explanation why rejected]

Alternative Solutions:
1. [Alternative 1]
2. [Alternative 2]

Reconsideration Condition:
[What needs to change for this to be reconsidered]
```

**Example: Promo Code Stacking**
```
Feature: Promo Code Stacking
Status: REJECTED
Reason: Complex pricing calculation with race condition risk
Risk Category: FINANCIAL + TECHNICAL

Explanation:
Allowing multiple promo codes simultaneously creates several issues:
1. Calculation complexity (which applies first? multiplicative or additive?)
2. Race condition when validating voucher usage limits
3. Audit trail nightmare (which code gave which discount?)
4. Potential for abuse (stack codes to get negative price)
5. Difficult to rollback if order cancelled

Alternative Solutions:
1. Single voucher per order (current implementation) ✅
2. Pre-bundled discounts (e.g., "COMBO50" already includes multiple benefits)
3. Tiered single code (e.g., "VIP20" = 20% + free shipping built-in)

Reconsideration Condition:
- Complete PROMO_STACKING_RULES.md document
- Proof of atomicity in voucher validation
- Comprehensive test suite (100+ test cases)
- Financial audit approval
- 6+ months production stability first

Likelihood of approval: 5%
```

### 3.3 Temporary Ban vs Permanent Ban

| Type | Example | Can Be Reconsidered? |
|------|---------|---------------------|
| **Temporary Ban** | Loyalty redemption (until system mature) | ✅ YES - After 6 months stability |
| **Temporary Ban** | Flash sale notification (until messaging system ready) | ✅ YES - After infrastructure ready |
| **Permanent Ban** | Admin override payment status | ❌ NO - Violates core principle |
| **Permanent Ban** | Edit order price after PAID | ❌ NO - Legal/audit requirement |
| **Permanent Ban** | Allow negative stock | ❌ NO - Financial safety |

---

## 4. FLOW PENGAJUAN FITUR

### 4.1 Official Feature Admission Process

**Stage 1: IDEATION (1 hari)**
```
1. Feature idea muncul (from user request, market research, etc.)
2. Write 1-page feature brief:
   - What: Feature description
   - Why: Business value
   - Who: Target users
   - Impact: Estimated usage, revenue impact
3. Owner review: GO or NO-GO to next stage
```

**Stage 2: RESEARCH (2-3 hari)**
```
1. Answer 5 critical questions (section 2)
2. Score the feature (0-5 YES)
3. Check against FORBIDDEN list
4. Identify dependencies and risks
5. Write initial technical design (1-2 pages)
6. Owner review: GO or NO-GO to next stage
```

**Stage 3: RULES DOCUMENTATION (3-5 hari)**
```
IF score >= 2 YES:
  1. Create FEATURE_NAME_RULES.md
     - Business rules
     - State transitions (if any)
     - Integration points
     - Failure modes
     - Rollback strategy
  2. Create technical specification
     - Database schema changes
     - API endpoints
     - Service dependencies
  3. Create test plan
     - Unit tests
     - Integration tests
     - Load tests
  4. Security review
  5. Owner review: APPROVE or REVISION NEEDED

IF score < 2 YES:
  - Skip to Stage 4 (lightweight)
```

**Stage 4: IMPLEMENTATION (variable)**
```
1. Code implementation
2. Pass all tests
3. Code review (2+ reviewers)
4. Security scan
5. Staging deployment
6. Owner review: DEPLOY or FIX
```

**Stage 5: PRODUCTION DEPLOYMENT**
```
1. Feature flag enabled (disabled by default)
2. Monitor for 24 hours
3. Gradual rollout (10% → 50% → 100%)
4. Owner review after 7 days: KEEP or ROLLBACK
```

### 4.2 Illegal Feature Paths (BANNED)

**These paths are PROHIBITED:**

❌ **Path 1: Code First, Ask Later**
```
Developer writes code → Asks owner to review
Result: REJECT + Wasted effort
```

❌ **Path 2: Skip Documentation**
```
Idea → Implement directly → Deploy
Result: ROLLBACK + Incident
```

❌ **Path 3: "It's a Small Change"**
```
"Just 10 lines" → No review → Breaks production
Result: ROLLBACK + Post-mortem required
```

❌ **Path 4: Bypass Owner Approval**
```
Dev thinks it's safe → Deploys → Owner finds out
Result: ROLLBACK + Process violation
```

**Penalty for Illegal Paths:**
- Immediate rollback
- Post-mortem report required
- Feature banned for 3 months minimum

### 4.3 Fast-Track Exceptions

**Only these qualify for fast-track (skip Stage 3):**

1. **Security Hotfix**
   - CVE patch
   - Immediate threat mitigation
   - Post-mortem within 48 hours after fix

2. **Critical Bug Fix**
   - Production broken
   - Revenue impact
   - User cannot checkout

3. **Performance Emergency**
   - Site down/slow
   - Database crash
   - Immediate optimization needed

**Fast-track does NOT mean:**
- Skip testing
- Skip code review
- Skip owner notification
- Skip documentation (can be done after)

---

## 5. DEFINISI "AMAN UNTUK MASUK"

### 5.1 Green Light Criteria

Feature dianggap AMAN untuk masuk jika:

**Technical Safety:**
- ✅ All tests pass (unit + integration)
- ✅ No performance degradation (< 5% slowdown)
- ✅ No new security vulnerabilities
- ✅ Rollback tested and works
- ✅ Feature flag implemented
- ✅ Monitoring in place

**Business Safety:**
- ✅ Tidak mengubah existing revenue flow
- ✅ Tidak menambah refund risk
- ✅ Tidak menambah legal exposure
- ✅ Tidak menambah support burden (training done)

**Operational Safety:**
- ✅ Documentation complete
- ✅ Runbook for incident created
- ✅ Alert configured
- ✅ Rollback plan tested

**Owner Approval:**
- ✅ Owner explicitly says "GO"
- ✅ Not just implied or assumed

### 5.2 Yellow Light (Defer)

Feature harus DITUNDA jika:

**Technical Debt:**
- ⚠️ Code quality below standard
- ⚠️ No tests or low coverage
- ⚠️ Performance concern exists
- ⚠️ Security review incomplete

**Resource Constraint:**
- ⚠️ Team bandwidth tidak cukup
- ⚠️ Infrastructure belum ready (e.g., Redis needed but not setup)
- ⚠️ Dependencies not stable

**Market Timing:**
- ⚠️ Not the right time (e.g., launching loyalty during holiday season)
- ⚠️ User not asking for it yet
- ⚠️ Low priority vs other features

**Action:** Defer to backlog with target date.

### 5.3 Red Light (Cancel)

Feature harus DIBATALKAN PERMANEN jika:

**Fundamental Issues:**
- 🔴 Violates core principles
- 🔴 Technical infeasibility (can't be done safely)
- 🔴 Legal blocker (requires license we don't have)
- 🔴 Financial risk too high

**Failed Attempts:**
- 🔴 Tried 3+ times, still fails staging
- 🔴 Causes production incidents 2+ times
- 🔴 Cannot pass security review after revision

**Strategic Change:**
- 🔴 Business model pivot (feature no longer relevant)
- 🔴 Market research shows no demand
- 🔴 ROI negative even at best case

**Action:** Document why cancelled, archive, never revisit.

---

## 6. DECISION MATRIX

Use this matrix to quickly evaluate any feature:

| Question | Answer | Score | Notes |
|----------|--------|-------|-------|
| Touches ORDER flow? | Yes/No | +2 if Yes | Core system |
| Touches PAYMENT flow? | Yes/No | +2 if Yes | Financial risk |
| Adds new state? | Yes/No | +1 if Yes | Complexity |
| Needs admin override? | Yes/No | +1 if Yes | Security risk |
| Financial risk? | Yes/No | +2 if Yes | Money involved |
| Changes locked rules? | Yes/No | +5 if Yes | Auto-reject |
| Performance impact? | High/Med/Low | +1 if High | System stability |
| Legal concern? | Yes/No | +2 if Yes | Compliance |

**Scoring:**
- **0-1:** CORE → Fast approve
- **2-4:** EXTENSION → Normal review
- **5-7:** HIGH RISK → Deep review + rules doc
- **8+:** FORBIDDEN → Reject

---

## 7. CONTOH EVALUASI LENGKAP

### Example A: Product Question & Answer Feature

**Brief:**
Allow users to ask questions on product page, admin answers.

**Evaluation:**
```
[ ] Touches ORDER? NO
[ ] Touches PAYMENT? NO
[ ] Adds new state? NO (own status: PENDING/ANSWERED)
[ ] Needs admin override? NO (admin just answers, no override)
[ ] Financial risk? NO

Score: 0 YES
Category: EXTENSION
```

**Decision:**
```
Status: ✅ APPROVED

Requirements:
1. New table: product_questions
2. New endpoint: GET/POST /api/products/[id]/questions
3. Admin endpoint: PATCH /api/admin/questions/[id]/answer
4. No synchronous processing (queue answers for moderation)
5. Rate limit: 1 question per user per product per day

Documentation: PRODUCT_QA_RULES.md (lightweight)
Review time: 2 hours
Implementation time: 2 days
```

---

### Example B: Loyalty Points Redemption

**Brief:**
Allow users to redeem loyalty points for discount during checkout.

**Evaluation:**
```
[x] Touches ORDER? YES (affects price calculation)
[ ] Touches PAYMENT? NO (discount applied before payment)
[ ] Adds new state? NO (uses existing discount field)
[ ] Needs admin override? NO (user-controlled)
[x] Financial risk? YES (reduces revenue)

Score: 2 YES
Category: HIGH RISK
```

**Decision:**
```
Status: ⚠️ CONDITIONAL APPROVAL

Requirements:
1. LOYALTY_REDEMPTION_RULES.md (comprehensive) - MANDATORY
2. Points deduction must be atomic with order creation
3. Points restore if order CANCELLED from PENDING_PAYMENT
4. Max 50% redemption of order total
5. Minimum order value Rp 100,000 to use points
6. 100 points = Rp 1,000 (fixed conversion, no dynamic)
7. Transaction log in PointTransaction table
8. No points change after order PAID
9. Admin cannot manually adjust points for order

Rules Document Must Cover:
- Business rules (conversion rate, limits)
- State transitions (earn, redeem, restore)
- Failure modes (order cancelled, payment failed)
- Audit requirements
- Fraud prevention

Review time: 4 hours (deep review)
Implementation time: 1 week
Testing: 50+ test cases required
```

---

### Example C: Manual Refund by Admin

**Brief:**
Admin can issue refund for order via admin panel.

**Evaluation:**
```
[x] Touches ORDER? YES (status → REFUNDED)
[x] Touches PAYMENT? YES (creates refund transaction)
[x] Adds new state? YES (REFUNDED - deprecated)
[x] Needs admin override? YES (admin approves refund)
[x] Financial risk? YES (money out)
[x] Changes locked rules? YES (REFUNDED is forbidden - section 11)

Score: 6 YES + Rule violation
Category: FORBIDDEN
```

**Decision:**
```
Status: ❌ REJECTED

Reason:
- Violates ORDER_PAYMENT_RULES.md section 11 (Refund out of scope)
- Adds REFUNDED state (marked as deprecated)
- Financial risk: real money movement
- Requires escrow/settlement account
- Requires financial license verification
- Complex reconciliation with payment gateway
- Audit complexity (who approved, when, why)

Alternative Solutions:
1. Manual refund via Midtrans dashboard (recommended) ✅
2. Partial refund ticket system (documented externally)
3. Store credit system (instead of cash back)

Reconsideration Conditions:
- System running stable for 12+ months
- Financial audit approval
- REFUND_SYSTEM_RULES.md complete (20+ pages expected)
- Escrow account setup with bank
- Legal review completed
- Accounting system integration

Likelihood of approval: < 10%
Not a priority. Use manual gateway refund.
```

---

## 8. ENFORCEMENT & COMPLIANCE

### 8.1 Who Enforces?

**Owner (Final Authority):**
- Final YES/NO on all features
- Can override rules (with documentation of why)
- Reviews all HIGH RISK features personally

**Tech Lead (Gatekeeper):**
- Reviews all EXTENSION features
- Ensures rules compliance
- Recommends approve/reject to Owner

**Developer (Proposer):**
- Must follow admission process
- Cannot bypass stages
- Must provide complete documentation

### 8.2 Violation Consequences

| Violation | Consequence |
|-----------|-------------|
| Skip documentation | Feature rejected, redo from Stage 3 |
| Deploy without approval | Immediate rollback, 1-week freeze on deploys |
| Bypass owner review | Feature banned for 3 months |
| Break core system | Post-mortem, process review, possible refactor |

### 8.3 Audit & Review

**Quarterly Review:**
- Review all approved features in last 3 months
- Check if rules were followed
- Measure: incidents, rollbacks, tech debt

**Annual Review:**
- Review this FEATURE_ADMISSION_RULES.md itself
- Update based on lessons learned
- Adjust scoring matrix if needed

---

## 9. SUMMARY CHECKLIST

Use this checklist for EVERY feature proposal:

```
FEATURE: ___________________________

STAGE 1: IDEATION
[ ] 1-page brief written
[ ] Business value clear
[ ] Owner initial review: GO/NO-GO

STAGE 2: RESEARCH
[ ] 5 critical questions answered
[ ] Score calculated: _____ YES
[ ] Category determined: CORE/EXTENSION/FORBIDDEN
[ ] If FORBIDDEN: STOP, reject with reason
[ ] Owner review: GO/NO-GO

STAGE 3: RULES (if score >= 2)
[ ] FEATURE_NAME_RULES.md created
[ ] Technical spec complete
[ ] Test plan written
[ ] Security reviewed
[ ] Owner review: APPROVED/REVISION

STAGE 4: IMPLEMENTATION
[ ] Code complete
[ ] All tests pass
[ ] Code review (2+ reviewers)
[ ] Staging deployed
[ ] Owner review: DEPLOY/FIX

STAGE 5: PRODUCTION
[ ] Feature flag deployed (OFF by default)
[ ] Monitoring active
[ ] Gradual rollout plan
[ ] Owner review after 7 days: KEEP/ROLLBACK

FINAL DECISION:
[ ] ✅ APPROVED - Feature is live
[ ] ⚠️ DEFERRED - Backlog with date: _______
[ ] ❌ REJECTED - Reason documented

Owner Signature: ___________________________
Date: ___________________________
```

---

## 10. APPENDIX: FEATURE CATALOG

### Current Approved Features (Baseline):
1. Product management (CORE)
2. Cart management (CORE)
3. Order creation (CORE)
4. Payment gateway (CORE)
5. Stock management (CORE)
6. Shipping calculation (CORE)
7. Email notifications (CORE)
8. Admin dashboard (CORE)
9. Flash sales (EXTENSION - approved)
10. Voucher system (EXTENSION - approved)
11. Reviews & ratings (EXTENSION - approved)
12. Loyalty points (EXTENSION - earn only, no redeem yet)

### Features Under Review:
(None currently)

### Features Permanently Rejected:
1. Instant refund - Financial risk
2. Admin override payment - Violates rules
3. Promo stacking - Complexity risk
4. Multi-currency - Out of scope
5. Buy now pay later - Financial license required
6. Cancel PAID order - Immutability rule
7. Dynamic pricing in checkout - User confusion

---

## 11. FINAL PRINCIPLES

**The Gate Exists For A Reason:**

> Every line of code is a liability until proven asset.  
> Every feature is a risk until proven safe.  
> Every change is a regression until proven improvement.

**The Answer is "NO" Until:**
- Business value is clear
- Technical safety is proven
- Rules are documented
- Owner explicitly approves
- Tests pass
- Monitoring ready

**When In Doubt:**
- Default to NO
- Ask for more evidence
- Document the concern
- Escalate to Owner

**Remember:**
> A system that works is better than a system with more features that breaks.

---

**END OF FEATURE ADMISSION RULES**

---

**Maintenance:**
- Review quarterly
- Update based on incidents
- Evolve as system matures

**Version History:**
- v1.0 (2025-12-23): Initial version

**Next Review:** 2026-03-23

---

This document is **LOCKED** and can only be changed with Owner approval and documented rationale.
