# P3 Supabase Automations

## Overview
Five automations for supply chain optimization, customer engagement, delivery management, and fraud prevention.

## P3.1 — Auto-Create Supplier Purchase Orders
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 2 * * *` (2 AM UTC = 3 AM Cameroon)  
**Action**: Automatically create POs for low-stock items

**Logic**:
1. Find products where quantity ≤ low_stock_threshold
2. For each product, find primary supplier
3. Skip if PO already exists in last 7 days
4. Calculate reorder quantity (50 units)
5. Create supplier_purchase_orders entry
6. Notify restaurant about auto-generated PO

**Output**: `supplier_purchase_orders` table + notification

**Use Case**: Prevent stockouts without manual order creation

---

## P3.2 — Auto-Generate Review Responses
**Type**: Trigger (Immediate)  
**Event**: New review inserted with rating < 4  
**Action**: Auto-generate contextual response

**Response Templates by Rating**:
- **1 star**: "Nous sommes vraiment désolés... Veuillez nous contacter directement"
- **2 stars**: "Merci pour votre feedback. Nous regrettons... Notre équipe travaille"
- **3 stars**: "Merci d'avoir partagé. Nous apprécions vos suggestions"

**Output**: `review_responses` table with is_auto_response=true

**Use Case**: Rapid customer engagement + shows we care about feedback

---

## P3.3 — Auto-Create Flash Promotions
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 * * * *` (Every hour at minute 0)  
**Action**: Create 20% flash promos for slow-moving items

**Criteria for Promotion**:
- Product sold < 2 times in last 7 days
- Active product
- Offer 20% discount
- Valid for 24 hours
- Unique code: FLASH_{hash}_{DDMM}

**Output**: `promotions` table + restaurant notification

**Use Case**: Drive sales for slow inventory + reduce stockout risk

---

## P3.4 — Auto-Assign Deliveries to Drivers
**Type**: Cron Job (Scheduled)  
**Schedule**: `*/5 * * * *` (Every 5 minutes)  
**Action**: Assign ready orders to available drivers

**Logic**:
1. Find orders with status='ready' AND delivery_type='delivery'
2. Check no delivery_assignment exists yet
3. Find nearest available driver (not assigned to active delivery)
4. Create delivery_assignment with estimated_delivery=45min
5. Update order status → 'on_the_way'
6. Notify driver of new delivery

**Output**: `delivery_assignments` table + driver notification

**Use Case**: Reduce manual dispatch load + optimize route planning

---

## P3.5 — Auto-Detect Fraudulent Orders
**Type**: Trigger (Immediate)  
**Event**: New order inserted  
**Action**: Score order risk and flag suspicious patterns

**Risk Flags & Scoring**:
1. **High Value Order** (> 500K FCFA): +25 points
2. **Rapid-Fire Orders** (4+ in 1 hour): +30 points
3. **New Customer Large Order** (1st/2nd order > 200K): +20 points
4. **Multiple Failed Payments** (3+ fails in 24h): +25 points

**Risk Levels**:
- **Critical** (score ≥ 80): Alert admin immediately
- **High** (score ≥ 60): Alert admin
- **Medium** (score ≥ 30): Flag for review
- **Low** (score < 30): No alert

**Output**: `order_fraud_scores` table + admin notification

**Use Case**: Catch suspicious orders before payment processing

---

## Schema Changes

### supplier_purchase_orders table (NEW)
- id UUID PK
- restaurant_id UUID FK
- supplier_id UUID FK
- status TEXT (pending|confirmed|delivered)
- total_amount INTEGER
- created_at, delivered_at TIMESTAMP

### promotions table (NEW)
- id UUID PK
- restaurant_id UUID FK
- code TEXT UNIQUE
- type TEXT (percentage|fixed|free_item)
- value INTEGER (% or amount)
- target_segment TEXT
- target_product_id UUID FK
- is_active BOOLEAN
- starts_at, ends_at TIMESTAMP

### review_responses table (NEW)
- id UUID PK
- review_id UUID FK
- response_text TEXT
- is_auto_response BOOLEAN
- created_at TIMESTAMP

### delivery_assignments table (NEW)
- id UUID PK
- order_id UUID FK
- driver_id UUID FK
- assigned_at TIMESTAMP
- estimated_delivery TIMESTAMP
- distance_km NUMERIC

### order_fraud_scores table (NEW)
- id UUID PK
- order_id UUID FK
- risk_score INTEGER (0-100)
- risk_level TEXT (low|medium|high|critical)
- flags JSONB (array of flag names)
- created_at TIMESTAMP

### Indexes Created
- `idx_supplier_po_restaurant` — query by restaurant + status
- `idx_supplier_po_created` — query by creation date
- `idx_promotions_restaurant_active` — query active promotions
- `idx_promotions_code` — quick code lookup
- `idx_delivery_assignments_driver` — query driver assignments
- `idx_delivery_assignments_order` — query order assignments
- `idx_fraud_scores_risk_level` — query by risk level
- `idx_fraud_scores_order` — query order fraud score

---

## Complete Cron Schedule (P0 + P1 + P2 + P3)

| Job | Schedule | Frequency | Purpose |
|-----|----------|-----------|---------|
| send-queued-emails | `*/5 * * * *` | Every 5 min | Email delivery |
| send-sms-notifications | `*/2 * * * *` | Every 2 min | SMS delivery |
| assign-deliveries | `*/5 * * * *` | Every 5 min | Driver assignment |
| update-customer-segments | `0 * * * *` | Hourly | RFM segmentation |
| create-flash-promotions | `0 * * * *` | Hourly | Auto-promotions |
| generate-daily-reports | `0 23 * * *` | Daily 11 PM | Restaurant reports |
| calculate-weekly-payouts | `0 1 * * 1` | Weekly Monday | Payout settlement |
| auto-complete-orders | `0 2 * * *` | Daily 2 AM | Order completion |
| create-supplier-orders | `0 2 * * *` | Daily 2 AM | Supplier orders |
| transition-scheduled-orders | `*/15 * * * *` | Every 15 min | Scheduled orders |
| marketplace-expire-packs | `0 * * * *` | Hourly | Pack expiration |
| reservation-reminders | `0 * * * *` | Hourly | Reservation reminders |

---

## Verification Checklist

- [x] P3.1: Cron job `create-supplier-orders` scheduled daily
- [x] P3.2: Trigger `trg_auto_respond_to_reviews` created on reviews
- [x] P3.3: Cron job `create-flash-promotions` scheduled hourly
- [x] P3.4: Cron job `assign-deliveries` scheduled every 5 min
- [x] P3.5: Trigger `trg_detect_fraud_on_order` created on orders
- [x] All 5 new tables created with RLS
- [x] All indexes created
- [x] Migrations applied via Supabase MCP