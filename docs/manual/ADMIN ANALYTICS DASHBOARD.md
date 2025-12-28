# Admin Analytics Dashboard - Implementation Guide

## 🎯 Architecture Overview

### Data Flow
```
Raw Data (Orders, Products, Users)
    ↓
Batch Processing (Cron Jobs @ 2 AM)
    ↓
Aggregated Tables (DailyMetrics, SellerMetrics, ProductMetrics)
    ↓
Analytics Service (Queries + Caching)
    ↓
API Endpoints
    ↓
Dashboard UI (Real-time + Cached)
```

### Caching Strategy

**3-Tier Caching:**
1. **Database Level**: Pre-aggregated daily metrics
2. **Redis Cache**: API responses (1min - 24hr TTL)
3. **Client Cache**: React Query / SWR for UI state

## 📊 Critical Metrics Explained

### 1. Sales Metrics

**GMV (Gross Merchandise Value)**
- Total order value (before fees)
- Most important top-line metric
- Formula: `SUM(order.totalAmount WHERE status NOT IN (CANCELLED))`

**Revenue**
- Platform earnings (after commission/fees)
- Formula: `GMV × (1 - commission_rate)`
- Typically: `GMV × 0.95` (5% platform fee)

**AOV (Average Order Value)**
- Average spend per order
- Formula: `GMV / total_orders`
- Key for pricing strategy

**Conversion Rate**
- Visitors who complete purchase
- Formula: `(paid_orders / visitors) × 100`

### 2. Customer Metrics

**LTV (Lifetime Value)**
- Total spend per customer over lifetime
- Formula: `SUM(order.totalAmount WHERE user_id = X AND status = COMPLETED)`
- Segment customers by LTV (VIP, Champion, etc.)

**Repeat Purchase Rate**
- % of customers who buy again
- Formula: `(returning_customers / total_customers) × 100`
- Target: > 30% for healthy e-commerce

**Customer Segments:**
- **NEW**: First purchase within 30 days
- **ACTIVE**: Purchased in last 90 days
- **AT_RISK**: No purchase in 90-180 days
- **DORMANT**: No purchase in 180+ days
- **VIP**: Top 10% spenders
- **CHAMPION**: High frequency + high value

### 3. Seller Metrics (for Marketplace)

**Completion Rate**
- % of orders successfully completed
- Formula: `(completed_orders / total_orders) × 100`
- Target: > 95%

**Response Time**
- Average time to confirm order
- Critical for customer satisfaction
- Target: < 2 hours

**Rating & Reviews**
- Average seller rating (1-5 stars)
- Track trends over time

### 4. Inventory Metrics

**Low Stock Alert**
- Products with < 10 units
- Trigger restock notifications

**Days of Inventory**
- How long current stock will last
- Formula: `(current_stock / avg_daily_sales) × 30`
- Flag if > 90 days (overstock)

**Stock-out Rate**
- % of products out of stock
- Formula: `(out_of_stock_count / total_products) × 100`
- Target: < 5%

## 🔧 Setup Instructions

### 1. Database Migration

```bash
# Add analytics schema
npx prisma migrate dev --name add_analytics_tables

# Generate Prisma client
npx prisma generate
```

### 2. Redis Setup (Optional but Recommended)

```bash
# Install Redis
npm install ioredis

# Docker compose
docker run -d -p 6379:6379 redis:alpine

# Or use managed service (Railway, Upstash, etc.)
```

**.env**
```env
REDIS_URL=redis://localhost:6379
```

### 3. Initialize Cron Jobs

```javascript
// pages/api/cron/analytics.js
import { setupAnalyticsCronJobs } from '@/lib/jobs/analyticsJobs';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Or use Vercel Cron, Railway Cron, etc.
  setupAnalyticsCronJobs();
  
  res.json({ success: true });
}
```

**Vercel Cron (vercel.json)**
```json
{
  "crons": [{
    "path": "/api/cron/analytics",
    "schedule": "0 2 * * *"
  }]
}
```

### 4. Backfill Historical Data

```javascript
// scripts/backfill-analytics.js
import { calculateDailyMetrics, calculateSellerMetrics, calculateProductMetrics } from '@/lib/jobs/analyticsJobs';

async function backfill() {
  const days = 90; // Last 90 days
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    console.log(`Processing ${date.toDateString()}...`);
    
    await calculateDailyMetrics(date);
    await calculateSellerMetrics(date);
    await calculateProductMetrics(date);
  }
  
  console.log('Backfill complete!');
}

backfill();
```

Run: `node scripts/backfill-analytics.js`

## 📝 Sample SQL Queries

### GMV by Month
```sql
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(total_gmv) as monthly_gmv,
  SUM(total_orders) as monthly_orders,
  AVG(average_order_value) as avg_aov
FROM "DailyMetrics"
WHERE date >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;
```

### Top Sellers by GMV
```sql
SELECT 
  u.name as seller_name,
  SUM(sm.total_gmv) as total_gmv,
  SUM(sm.total_orders) as total_orders,
  AVG(sm.completion_rate) as avg_completion_rate,
  AVG(sm.average_rating) as avg_rating
FROM "SellerMetrics" sm
JOIN "User" u ON sm.seller_id = u.id
WHERE sm.date >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY total_gmv DESC
LIMIT 10;
```

### Customer Segmentation Distribution
```sql
SELECT 
  segment,
  COUNT(*) as customer_count,
  SUM(lifetime_value) as total_ltv,
  AVG(lifetime_value) as avg_ltv,
  AVG(total_orders) as avg_orders
FROM "CustomerMetrics"
GROUP BY segment
ORDER BY total_ltv DESC;
```

### Product Performance
```sql
SELECT 
  p.name,
  SUM(pm.units_sold) as total_sold,
  SUM(pm.revenue) as total_revenue,
  AVG(pm.conversion_rate) as avg_conversion,
  AVG(pm.average_rating) as avg_rating
FROM "ProductMetrics" pm
JOIN "Product" p ON pm.product_id = p.id
WHERE pm.date >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_revenue DESC
LIMIT 20;
```

### Sales Trend (Daily)
```sql
SELECT 
  date,
  total_gmv,
  total_orders,
  average_order_value,
  new_customers,
  returning_customers,
  (returning_customers::float / NULLIF(new_customers + returning_customers, 0)) * 100 as repeat_rate
FROM "DailyMetrics"
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date ASC;
```

### Inventory Health
```sql
SELECT 
  status,
  COUNT(*) as count
FROM (
  SELECT 
    CASE 
      WHEN stock = 0 THEN 'Out of Stock'
      WHEN stock < 10 THEN 'Low Stock'
      WHEN stock > 100 THEN 'Overstock'
      ELSE 'Normal'
    END as status
  FROM "Product"
  WHERE status = 'ACTIVE'
) t
GROUP BY status;
```

## 🎨 Dashboard UI Components

### Install Dependencies

```bash
npm install recharts
npm install @tanstack/react-query
npm install date-fns
```

### React Query Setup

```javascript
// pages/_app.js
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

### Custom Hooks

```javascript
// hooks/useAnalytics.js
import { useQuery } from '@tanstack/react-query';

export function useDashboardOverview(period = 'today') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/overview?period=${period}`);
      return res.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

export function useSalesTrend(period = 'month') {
  return useQuery({
    queryKey: ['sales-trend', period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/sales-trend?period=${period}`);
      return res.json();
    },
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/inventory-alerts');
      return res.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}
```

## 🔔 Alert System

### Creating Alerts

```javascript
// When low stock detected
await analyticsService.createAlert({
  type: 'LOW_STOCK',
  severity: 'WARNING',
  metric: 'inventory_level',
  threshold: 10,
  currentValue: product.stock,
  entityType: 'product',
  entityId: product.id,
  message: `Product "${product.name}" is low on stock (${product.stock} remaining)`,
  metadata: {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
  },
});
```

### Alert Monitoring Job

```javascript
// lib/jobs/monitoringJobs.js
export async function checkCriticalMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check cancellation rate
  const orders = await prisma.order.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: today,
      },
    },
    _count: true,
  });

  const total = orders.reduce((sum, o) => sum + o._count, 0);
  const cancelled = orders.find(o => o.status === 'CANCELLED')?._count || 0;
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

  if (cancellationRate > 20) {
    await analyticsService.createAlert({
      type: 'HIGH_CANCELLATION',
      severity: 'CRITICAL',
      metric: 'cancellation_rate',
      threshold: 20,
      currentValue: cancellationRate,
      message: `High cancellation rate today: ${cancellationRate.toFixed(2)}%`,
    });
  }

  // Check payment failure rate
  const payments = await prisma.payment.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: today,
      },
    },
    _count: true,
  });

  const totalPayments = payments.reduce((sum, p) => sum + p._count, 0);
  const failed = payments.find(p => p.status === 'FAILED')?._count || 0;
  const failureRate = totalPayments > 0 ? (failed / totalPayments) * 100 : 0;

  if (failureRate > 10) {
    await analyticsService.createAlert({
      type: 'PAYMENT_FAILURE_SPIKE',
      severity: 'CRITICAL',
      metric: 'payment_failure_rate',
      threshold: 10,
      currentValue: failureRate,
      message: `High payment failure rate: ${failureRate.toFixed(2)}%`,
    });
  }
}

// Run every hour
cron.schedule('0 * * * *', checkCriticalMetrics);
```

## 📱 Mobile Dashboard (Optional)

Use same API endpoints with responsive design:

```javascript
// components/MobileDashboard.jsx
export default function MobileDashboard() {
  // Same hooks and data fetching
  // Optimized layout for mobile screens
  
  return (
    <div className="p-4 space-y-4">
      {/* Swipeable KPI cards */}
      {/* Compact charts */}
      {/* Pull-to-refresh */}
    </div>
  );
}
```

## 🚀 Performance Optimization

### Database Indexing
```sql
-- Critical indexes for analytics queries
CREATE INDEX idx_order_created_status ON "Order"(created_at, status);
CREATE INDEX idx_order_user_created ON "Order"(user_id, created_at);
CREATE INDEX idx_daily_metrics_date ON "DailyMetrics"(date);
CREATE INDEX idx_seller_metrics_seller_date ON "SellerMetrics"(seller_id, date);
CREATE INDEX idx_product_metrics_product_date ON "ProductMetrics"(product_id, date);
```

### Query Optimization Tips

1. **Use aggregated tables** instead of raw queries when possible
2. **Implement pagination** for large result sets
3. **Cache expensive calculations** in Redis
4. **Use database views** for complex recurring queries
5. **Monitor slow queries** with pg_stat_statements

### Example: Create Database View

```sql
CREATE VIEW monthly_sales_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(total_gmv) as gmv,
  SUM(total_orders) as orders,
  AVG(average_order_value) as aov,
  SUM(new_customers) as new_customers
FROM "DailyMetrics"
GROUP BY month;
```

## 📈 Advanced Analytics (Future)

### Cohort Analysis
Track customer behavior by signup cohort:
- Month 0: % who made first purchase
- Month 1: % who made second purchase
- Month 3, 6, 12: Retention rates

### RFM Segmentation
- **Recency**: Days since last purchase
- **Frequency**: Number of purchases
- **Monetary**: Total spend
- Score 1-5 on each dimension

### Predictive Analytics
- Churn prediction (logistic regression)
- Demand forecasting (time series)
- Customer LTV prediction

## 🔒 Security Considerations

1. **Admin-only endpoints** - Require ADMIN role
2. **Rate limiting** - Prevent abuse of analytics APIs
3. **Data masking** - Hide sensitive customer info
4. **Audit logging** - Track who views what data
5. **Export controls** - Limit data export capabilities

## 📊 Recommended Charts Library: Recharts

**Why Recharts?**
- ✅ Built for React
- ✅ Responsive by default
- ✅ Great documentation
- ✅ Customizable
- ✅ Good performance

**Alternatives:**
- Chart.js - More features, steeper learning curve
- Victory - More complex API
- Nivo - Beautiful but heavier
- D3.js - Full control but manual work

## 🎯 Success Metrics

After implementation, monitor:
- Dashboard load time (< 2 seconds)
- Cache hit rate (> 80%)
- Data freshness (< 5 minutes lag)
- Admin engagement (daily active usage)

**KPIs to track:**
- GMV growth rate
- Customer retention rate
- Seller performance trends
- Inventory turnover ratio