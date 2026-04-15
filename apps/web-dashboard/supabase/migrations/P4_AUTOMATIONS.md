# P4 Supabase Automations — Advanced ML-Driven Intelligence

## Overview
Five advanced ML-driven automations for dynamic pricing, predictive analytics, personalized recommendations, churn prediction, and demand forecasting.

## P4.1 — Dynamic Pricing Engine
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 * * * *` (Every hour at minute 0)  
**Action**: Calculate dynamic prices based on real-time demand and inventory levels

**Logic**:
1. Count orders in last 24 hours for demand classification
2. Determine demand_level: peak (≥20), high (≥10), medium (≥5), low (<5)
3. Apply price multiplier: peak +15%, high +10%, medium 0%, low -10%
4. Adjust for inventory: low stock (<5) +5%, overstock (>50) -5%
5. Calculate dynamic_price = FLOOR(base_price × price_factor)
6. Upsert into `dynamic_prices` table

**Output**: `dynamic_prices` table

**Use Case**: Maximize revenue during peak demand, clear inventory during low periods

---

## P4.2 — Predictive Analytics & Forecasting
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 0 * * *` (Daily at midnight UTC = 1 AM Cameroon)  
**Action**: Predict next day's orders and revenue for each restaurant

**Logic**:
1. For each published restaurant, calculate:
   - Last 7 days: orders count, total revenue
   - Last 30 days: average orders, average revenue
2. Predict tomorrow: 7-day avg × 1.1 (growth factor)
3. Determine trend:
   - Up: if 7-day avg > 30-day avg × 1.1 (confidence 85%)
   - Down: if 7-day avg < 30-day avg × 0.9 (confidence 80%)
   - Stable: else (confidence 75%)
4. Alert restaurant if downward trend detected

**Output**: `predictive_analytics` table + restaurant notification

**Use Case**: Enable proactive inventory planning, staffing adjustments, promotional strategy

---

## P4.3 — Personalized Recommendation Engine
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 * * * *` (Every hour at minute 0)  
**Action**: Generate personalized product recommendations per customer

**Scoring Factors**:
- **Product Popularity** (0-0.3): Count distinct customers ordering in last 30 days
- **Category Affinity** (0.25): Match customer's favorite product categories
- **Rating Quality** (0-0.15): Average product rating (4.0+) from last 60 days
- **Price Compatibility** (0.2): Products within ±50% of customer's average spend

**Logic**:
1. For each customer with 90-day order history
2. Clear recommendations older than 7 days
3. Find products NOT already ordered by customer
4. Calculate weighted score (0-1)
5. Insert if score > 0.3

**Output**: `product_recommendations` table

**Use Case**: Increase average order value, improve customer engagement, drive cross-sell

---

## P4.4 — Churn Prediction & Retention Automation
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 2 * * *` (Daily 2 AM UTC = 3 AM Cameroon)  
**Action**: Identify at-risk customers and auto-send retention offers

**Risk Scoring**:
- **Recency** (strongest predictor):
  - 90+ days inactive: +0.5
  - 60+ days inactive: +0.35
  - 30+ days inactive: +0.2
- **Frequency Decline**: Order rate <33% of 90-day avg: +0.25
- **Spending Decline**: Recent spend <50% of average: +0.2
- **Negative Feedback**: 3-star or lower rating in last 30 days: +0.15

**Risk Levels** (0-1 scale):
- Critical (≥0.7): Auto-send 20% discount retention offer, notify restaurant
- Medium (0.3-0.7): Flag for review
- Low (<0.3): No action

**Output**: 
- `churn_predictions` table with risk scores
- Auto-generated `promotions` (20% off, 14-day validity)
- `restaurant_notifications` for high-risk alerts

**Use Case**: Reduce customer churn, improve lifetime value, targeted reactivation campaigns

---

## P4.5 — Demand Forecasting for Inventory
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 23 * * *` (Daily 11 PM UTC = Midnight Cameroon)  
**Action**: Predict product demand for next 7 days

**Prediction Algorithm**:
1. For each restaurant, forecast 7 days ahead per product
2. Base prediction: 7-day average order quantity ÷ 7
3. Adjust for day-of-week patterns (60-day history)
4. Weekend boost: +15% for Saturdays/Sundays
5. Apply trend: if 7-day > 30-day × 1.1 → +10%, if <0.9 → -5%
6. Confidence score: 0.5-0.95 based on data quality and trend

**Alerts**:
- Flag when predicted demand > current stock AND stock < low_stock_threshold
- Send `demand_vs_stock_alert` notification to restaurant

**Output**: `demand_forecasts` table

**Use Case**: Optimize inventory procurement, reduce stockouts, improve supply chain efficiency

---

## Schema Changes

### dynamic_prices table (P4.1)
- id UUID PK
- product_id UUID FK
- base_price INTEGER
- dynamic_price INTEGER
- price_factor NUMERIC
- demand_level TEXT (low|medium|high|peak)
- inventory_level INTEGER
- updated_at TIMESTAMP

### predictive_analytics table (P4.2)
- id UUID PK
- restaurant_id UUID FK
- forecast_date DATE
- predicted_orders INTEGER
- predicted_revenue INTEGER
- confidence_score NUMERIC (0-1)
- trend TEXT (up|stable|down)
- created_at TIMESTAMP

### product_recommendations table (P4.3)
- id UUID PK
- customer_id UUID FK
- product_id UUID FK
- restaurant_id UUID FK
- score NUMERIC (0-1)
- reason TEXT
- created_at TIMESTAMP
- UNIQUE(customer_id, product_id, restaurant_id)

### churn_predictions table (P4.4)
- id UUID PK
- customer_id UUID FK
- restaurant_id UUID FK
- risk_score NUMERIC (0-1)
- last_order_date TIMESTAMP
- days_inactive INTEGER
- reason TEXT
- retention_offer_sent BOOLEAN
- created_at, updated_at TIMESTAMP
- UNIQUE(customer_id, restaurant_id)

### demand_forecasts table (P4.5)
- id UUID PK
- restaurant_id UUID FK
- product_id UUID FK
- forecast_date DATE
- predicted_quantity INTEGER
- confidence_score NUMERIC (0-1)
- created_at TIMESTAMP
- UNIQUE(restaurant_id, product_id, forecast_date)

### Indexes Created
- `idx_dynamic_prices_product` — query by product + demand_level
- `idx_predictive_analytics_restaurant_date` — query by restaurant + forecast_date
- `idx_recommendations_customer` — query by customer recommendations
- `idx_churn_predictions_risk_score` — query by risk level
- `idx_demand_forecasts_restaurant_date` — query by restaurant forecast

---

## Complete Cron Schedule (P0 + P1 + P2 + P3 + P4)

| Job | Schedule | Frequency | Purpose |
|-----|----------|-----------|---------|
| send-queued-emails | `*/5 * * * *` | Every 5 min | Email delivery |
| send-sms-notifications | `*/2 * * * *` | Every 2 min | SMS delivery |
| assign-deliveries | `*/5 * * * *` | Every 5 min | Driver assignment |
| transition-scheduled-orders | `*/15 * * * *` | Every 15 min | Scheduled orders |
| generate-recommendations | `0 * * * *` | Hourly | Personalization |
| update-customer-segments | `0 * * * *` | Hourly | RFM segmentation |
| create-flash-promotions | `0 * * * *` | Hourly | Auto-promotions |
| marketplace-expire-packs | `0 * * * *` | Hourly | Pack expiration |
| reservation-reminders | `0 * * * *` | Hourly | Reservation reminders |
| generate-daily-reports | `0 23 * * *` | Daily 11 PM | Restaurant reports |
| forecast-demand | `0 23 * * *` | Daily 11 PM | Demand forecasting |
| auto-complete-orders | `0 2 * * *` | Daily 2 AM | Order completion |
| create-supplier-orders | `0 2 * * *` | Daily 2 AM | Supplier orders |
| predict-churn | `0 2 * * *` | Daily 2 AM | Churn prediction |
| calculate-weekly-payouts | `0 1 * * 1` | Weekly Monday | Payout settlement |

---

## Verification Checklist

- [x] P4.1: Function `calculate_dynamic_prices()` created with hourly cron
- [x] P4.2: Function `generate_predictive_analytics()` created with daily cron
- [x] P4.3: Function `generate_product_recommendations()` created with hourly cron
- [x] P4.4: Function `predict_customer_churn()` created with daily cron
- [x] P4.5: Function `forecast_product_demand()` created with daily cron
- [x] All 5 new tables created with proper constraints and indexes
- [x] RLS policies applied to all P4 tables
- [x] All 5 cron jobs scheduled in pg_cron
- [x] Migrations applied via Supabase MCP
- [x] Code committed to GitHub main branch

---

## Key Features

**Idempotency**: All functions use UPSERT (INSERT ... ON CONFLICT) for safe re-execution

**Notifications**: 
- Restaurants automatically notified of:
  - Demand forecasts with stock warnings
  - Churn risk customer alerts with retention offer details
  - Downward trend predictions for proactive action

**Performance**:
- Efficient window functions and aggregations
- Strategic indexing on foreign keys and date ranges
- Cron jobs run off-peak to minimize database load

**Cameroon Timezone**:
- All UTC schedules account for UTC+1 Cameroon offset
- Daily jobs scheduled at 2-3 AM for low-traffic hours
