# 📖 Complete Backend API Documentation

**Total Endpoints:** 44 APIs  
**Roles:** CUSTOMER, ADMIN, SUPER_ADMIN

---

## 🧭 Navigation

1. [Customer Journey](#-customer-journey)
2. [Admin Journey](#-admin-journey)
3. [API Reference](#-complete-api-reference)

---

# 👤 CUSTOMER JOURNEY

## Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ONBOARDING                                                   │
│     Register → Verify Email → Login                             │
│                                                                  │
│  2. SHOPPING                                                     │
│     Browse → Search → View Detail → Add to Cart                 │
│                                                                  │
│  3. CHECKOUT                                                     │
│     Select Address → Calculate Shipping → Apply Voucher         │
│                     → Use Points → Create Order                 │
│                                                                  │
│  4. PAYMENT                                                      │
│     Create Payment → Pay via Midtrans → Webhook Confirms        │
│                                                                  │
│  5. POST-ORDER                                                   │
│     Track Order → Receive → Write Review → Earn Points          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ **Authentication Flow**

### Register
```http
POST /api/auth/register

{
  "email": "user@example.com",
  "password": "Password123",    // min 8 char, uppercase, lowercase, number
  "name": "John Doe",
  "phone": "081234567890"
}
```

### Login
```http
POST /api/auth/login

{
  "email": "user@example.com",
  "password": "Password123"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": { "id": "...", "name": "...", "role": "CUSTOMER" }
}
```

### Other Auth Endpoints
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request reset email
- `POST /api/auth/reset-password` - Reset with token
- `GET /api/auth/me` - Get current user (requires token)

---

## 2️⃣ **Product Browsing**

### List Products
```http
GET /api/products
GET /api/products?page=1&limit=12
```

### Search with Filters
```http
GET /api/products/search?q=laptop&category=xxx&minPrice=1000000&maxPrice=5000000&sortBy=cheapest

Query Parameters:
- q: search keyword
- category: category UUID
- minPrice, maxPrice: price range
- sortBy: newest | cheapest | expensive | popular
- page, limit: pagination
```

### Other Product Endpoints
- `GET /api/products/{slug}` - Product detail
- `GET /api/products/suggestions?q=lap` - Autocomplete
- `GET /api/products/{slug}/recommendations` - Related products
- `GET /api/categories` - All categories

---

## 3️⃣ **Shopping Cart**

```http
GET /api/cart                    # Get cart
POST /api/cart                   # Add item
PUT /api/cart                    # Update quantity
DELETE /api/cart                 # Remove item

All require: Authorization: Bearer {token}
```

### Add to Cart
```http
POST /api/cart
{
  "productId": "uuid",
  "variantId": "uuid or null",
  "quantity": 2
}
```

---

## 4️⃣ **Address & Shipping**

### Manage Addresses
```http
GET /api/addresses               # List addresses
POST /api/addresses              # Add address
PUT /api/addresses               # Update address
DELETE /api/addresses            # Delete address
```

### Shipping APIs (RajaOngkir)
```http
GET /api/shipping/provinces      # Get all provinces
GET /api/shipping/cities?provinceId=11    # Cities in province
POST /api/shipping/cost          # Calculate shipping
{
  "destination": "151",   // city ID
  "weight": 1000,         // grams
  "courier": "jne"        // jne|pos|tiki|sicepat
}
```

---

## 5️⃣ **Checkout & Payment**

### Validate Voucher
```http
POST /api/vouchers/validate
{
  "code": "DISKON50",
  "orderTotal": 500000
}
```

### Create Order
```http
POST /api/orders
{
  "addressId": "uuid",
  "items": [
    { "productId": "uuid", "variantId": null, "quantity": 2 }
  ],
  "shippingMethod": {
    "courier": "jne",
    "service": "REG",
    "cost": 25000,
    "etd": "2-3 hari"
  },
  "voucherCode": "DISKON50",
  "usePoints": 1000,
  "notes": "Bubble wrap please"
}
```

### Create Payment
```http
POST /api/payment/create
{
  "orderId": "uuid"
}

Response:
{
  "snapToken": "xxx",
  "redirectUrl": "https://app.midtrans.com/snap/..."
}
```

---

## 6️⃣ **Order Tracking**

```http
GET /api/orders              # List my orders
GET /api/orders/{id}         # Order detail
```

### Order Status Flow
```
PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED → COMPLETED
                                                         ↓
                                                    CANCELLED/REFUNDED
```

---

## 7️⃣ **Reviews & Points**

### Reviews
```http
GET /api/reviews?productId=xxx              # Get product reviews
POST /api/reviews                           # Write review
POST /api/reviews/{id}/helpful              # Mark helpful
```

### Loyalty Points
```http
GET /api/points                             # Get balance & history
POST /api/points { "action": "DAILY_CHECKIN" }   # Daily check-in
POST /api/points { "action": "REDEEM", "amount": 1000 }  # Redeem
```

---

# 👨‍💼 ADMIN JOURNEY

## Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DASHBOARD                                                    │
│     View Stats → Revenue Chart → Best Sellers                   │
│                                                                  │
│  2. PRODUCT MANAGEMENT                                           │
│     List → Add → Edit → Delete → Upload Images                  │
│                                                                  │
│  3. ORDER MANAGEMENT                                             │
│     View Orders → Update Status → Add Tracking → Process Refund │
│                                                                  │
│  4. CUSTOMER MANAGEMENT                                          │
│     View Customers → Chat Support                                │
│                                                                  │
│  5. PROMOTIONS                                                   │
│     Flash Sales → Bundles → Vouchers                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ **Dashboard & Analytics**

```http
GET /api/admin/stats                    # Overview stats
GET /api/admin/analytics?period=30d     # Revenue chart (7d|30d|90d|1y)
GET /api/admin/best-sellers?limit=10    # Top selling products
```

### Stats Response
```json
{
  "totalOrders": 1500,
  "totalRevenue": 150000000,
  "totalProducts": 120,
  "totalCustomers": 800,
  "pendingOrders": 25,
  "lowStockProducts": 5
}
```

---

## 2️⃣ **Product Management**

```http
GET /api/admin/products             # List all products
POST /api/admin/products            # Create product
PUT /api/admin/products/{id}        # Update product
DELETE /api/admin/products/{id}     # Delete product
```

### Create Product
```json
{
  "name": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "Latest Apple smartphone...",
  "categoryId": "uuid",
  "basePrice": 20000000,
  "salePrice": 18500000,
  "stock": 50,
  "weight": 200,
  "images": ["https://..."],
  "isFeatured": true
}
```

---

## 3️⃣ **Order Management**

```http
GET /api/admin/orders                    # List all orders
GET /api/admin/orders?status=PAID        # Filter by status
PUT /api/orders/{id}                     # Update status
```

### Update Order Status
```json
{
  "status": "SHIPPED",
  "trackingNumber": "JNE12345678"
}
```

### Status Transitions
| From | To | Action |
|------|-----|--------|
| PENDING_PAYMENT | CANCELLED | Auto after 24h |
| PAID | PROCESSING | Admin confirms |
| PROCESSING | SHIPPED | Add tracking number |
| SHIPPED | DELIVERED | Courier confirms |
| DELIVERED | COMPLETED | Auto after 7 days |

---

## 4️⃣ **Customer & Chat**

```http
GET /api/admin/customers             # List customers
GET /api/admin/customers/{id}        # Customer detail
GET /api/admin/chat                  # All chat messages
POST /api/admin/chat                 # Reply to customer
```

---

## 5️⃣ **Flash Sale Management**

```http
GET /api/admin/flash-sales           # List flash sales
POST /api/admin/flash-sales          # Create flash sale
```

### Create Flash Sale
```json
{
  "name": "Year End Sale",
  "slug": "year-end-sale",
  "startTime": "2024-12-25T00:00:00Z",
  "endTime": "2024-12-25T23:59:59Z",
  "products": [
    { "productId": "uuid", "salePrice": 150000, "stockLimit": 100 }
  ]
}
```

---

# 📚 COMPLETE API REFERENCE

## Summary by Category

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Auth | 6 | Partial |
| Products | 6 | No |
| Cart | 4 | Yes |
| Orders | 3 | Yes |
| Payment | 3 | Partial |
| Shipping | 3 | No |
| Admin | 10 | Yes (Admin) |
| Promotions | 3 | Partial |
| Reviews | 3 | Partial |
| Points | 2 | Yes |
| Support | 3 | Partial |
| System | 2 | Partial |
| **TOTAL** | **44** | |

---

## Authentication Header

```http
Authorization: Bearer {jwt-token}
```

Token obtained from `/api/auth/login`

---

## Response Format

### Success
```json
{
  "success": true,
  "message": "...",
  "data": {...}
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "errors": [{ "field": "email", "message": "Invalid" }]
}
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalItems": 100,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Rate Limits

| Endpoint Type | Limit | Block Duration |
|---------------|-------|----------------|
| Global | 100 req/min | - |
| Auth | 10 req/min | 5 min |
| Payment | 5 req/min | 10 min |
| Search | 30 req/min | - |

---

**Last Updated:** 22 Desember 2024
