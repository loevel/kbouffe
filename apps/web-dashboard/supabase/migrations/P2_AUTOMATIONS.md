# P2 Supabase Automations

## Overview
Five automations for customer communications, business analytics, and financial operations.

## P2.1 — Auto-Queue Email Notifications
**Type**: Trigger (Immediate) + Cron (Batch Processing)  
**Event**: Order status changes (confirmed, preparing, ready, on_the_way, delivered, cancelled)  
**Action**: Queue email in `email_sends` table with template and subject

**Templates**:
- `order_confirmed` → "Commande #XXX confirmée"
- `order_preparing` → "Commande #XXX en préparation"
- `order_ready` → "Commande #XXX prête"
- `order_on_the_way` → "Commande #XXX en chemin"
- `order_delivered` → "Commande #XXX livrée"
- `order_cancelled` → "Commande #XXX annulée"

**Cron Job**: `send-queued-emails` runs every 5 minutes (`*/5 * * * *`)

**Use Case**: Transactional emails sent asynchronously without blocking order updates

---

## P2.2 — Auto-Queue SMS on Delivery
**Type**: Trigger (Immediate) + Cron (Batch Processing)  
**Event**: Order status → 'on_the_way', 'delivered', or 'cancelled'  
**Action**: Queue SMS in admin_notifications with phone number

**SMS Templates**:
- `on_the_way`: "Votre commande #XXX est en chemin. Code: YYY"
- `delivered`: "Commande #XXX livrée. Merci de votre commande !"
- `cancelled`: "Commande #XXX annulée. Remboursement en cours."

**Cron Job**: `send-sms-notifications` runs every 2 minutes (`*/2 * * * *`)

**Use Case**: Real-time SMS updates via Twilio/MTN API without blocking updates

---

## P2.3 — Auto-Generate Daily Reports
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 23 * * *` (11 PM UTC = Midnight Cameroon UTC+1)  
**Action**: Calculate daily metrics for all published restaurants

**Metrics Calculated**:
- Orders count (paid, not cancelled)
- Revenue total
- Average rating (last 30 days)

**Output**: `restaurant_notifications` with type `daily_summary`

**Payload**: date, orders_count, revenue, avg_rating

**Use Case**: Restaurant owners get daily performance summary each morning

---

## P2.4 — Auto-Calculate Weekly Payouts
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 1 * * 1` (1 AM UTC on Mondays = 2 AM Cameroon Monday)  
**Action**: Calculate settlement amounts for completed orders

**Calculation Process**:
1. Get all completed orders from last 7 days
2. Sum revenue per restaurant
3. Calculate platform fee (10%)
4. Calculate net amount (revenue - fee)
5. Insert into `payout_calculations` table
6. Create `payout_events` for settlement

**Fields**:
- gross_revenue: Total from completed orders
- platform_fee: 10% of gross
- net_amount: Amount to transfer to restaurant
- status: 'pending' (awaiting settlement)

**Use Case**: Automated weekly settlement calculations for transparent payouts

---

## P2.5 — Auto-Segment Customers by RFM
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 * * * *` (Every hour at minute 0)  
**Action**: Segment customers using Recency, Frequency, Monetary analysis

**RFM Metrics**:
- **Recency**: Days since last order
- **Frequency**: Order count per restaurant
- **Monetary**: Total spent + average order value

**Segments**:
- **VIP**: Last order ≤ 7 days AND ≥ 5 orders
- **Loyal**: Last order ≤ 30 days AND ≥ 3 orders
- **At Risk**: Last order > 30 days AND < 3 orders
- **Dormant**: Last order > 90 days
- **New**: Only 1 order

**Output**: `customer_segments` table

**Use Case**: Targeted marketing, personalized recommendations, churn prevention

---

## Schema Changes

### email_sends table
- ADD `order_id` UUID FK
- ADD `email_type` TEXT (template identifier)
- ADD `status` TEXT DEFAULT 'pending'

### customer_segments table (NEW)
- id UUID PK
- customer_id UUID FK
- restaurant_id UUID FK
- segment TEXT (vip|loyal|dormant|new|at_risk)
- order_count INT
- total_spent INT
- last_order_date TIMESTAMP
- days_since_order INT
- avg_order_value INT
- UNIQUE(customer_id, restaurant_id)

### payout_calculations table (NEW)
- id UUID PK
- restaurant_id UUID FK
- calculation_date DATE
- orders_count INT
- gross_revenue INT
- platform_fee INT
- net_amount INT
- status TEXT DEFAULT 'pending'
- UNIQUE(restaurant_id, calculation_date)

### Indexes Created
- `idx_customer_segments_restaurant` — query by restaurant + segment
- `idx_customer_segments_last_order` — query dormant/active customers
- `idx_customer_segments_days_since` — query by recency
- `idx_payout_calculations_restaurant` — query payouts by restaurant
- `idx_email_sends_status` — query pending emails

---

## Cron Jobs Summary (P0 + P1 + P2)

| Job | Schedule | Frequency | Purpose |
|-----|----------|-----------|---------|
| send-queued-emails | `*/5 * * * *` | Every 5 min | Email delivery |
| send-sms-notifications | `*/2 * * * *` | Every 2 min | SMS delivery |
| update-customer-segments | `0 * * * *` | Hourly | RFM segmentation |
| generate-daily-reports | `0 23 * * *` | Daily 11 PM | Restaurant reports |
| calculate-weekly-payouts | `0 1 * * 1` | Weekly Monday | Payout settlement |
| auto-complete-orders | `0 2 * * *` | Daily 2 AM | Order completion |
| transition-scheduled-orders | `*/15 * * * *` | Every 15 min | Scheduled orders |
| marketplace-expire-packs | `0 * * * *` | Hourly | Pack expiration |
| reservation-reminders | `0 * * * *` | Hourly | Reservation reminders |

---

## Verification Checklist

- [x] P2.1: Trigger `trg_queue_email_on_order_status` created on orders
- [x] P2.2: Trigger `trg_queue_sms_on_delivery` created on orders
- [x] P2.3: Cron job `generate-daily-reports` scheduled daily
- [x] P2.4: Cron job `calculate-weekly-payouts` scheduled weekly
- [x] P2.5: Cron job `update-customer-segments` scheduled hourly
- [x] `customer_segments` table created with RLS
- [x] `payout_calculations` table created with RLS
- [x] All indexes created
- [x] Migrations applied via Supabase MCP
