# P1 Supabase Automations

## Overview
Five next-generation automations that handle kitchen operations, inventory management, and order completion.

## P1.1 — Auto-KDS Notifications
**Type**: Trigger (Immediate)  
**Event**: Order status → `confirmed` + payment_status = `paid`  
**Action**: Create restaurant notification with full order details

**Table**: `restaurant_notifications`  
**Type**: `new_order_kds`  
**Payload**: order_id, order_number, customer_name, total, item_count, delivery_type

**Use Case**: Kitchen staff see new paid orders instantly with item count and customer name

---

## P1.2 — Auto-Inventory Decrement  
**Type**: Trigger (Immediate)  
**Event**: Order payment_status → `paid`  
**Action**: Loop through order_items and decrement stock quantities

**Tables**: `stock`, `order_items`  
**Logic**:
1. When payment confirmed
2. For each item in order
3. Decrement `stock.quantity` by order item quantity

**Use Case**: Real-time inventory tracking without manual updates

---

## P1.3 — Auto-Low Stock Alerts
**Type**: Trigger (Immediate)  
**Event**: Stock quantity updated to below threshold  
**Action**: Create restaurant alert notification

**Table**: `restaurant_notifications`  
**Type**: `low_stock_alert`  
**Deduplication**: Max 1 alert per product per 2 hours

**Payload**: product_id, product_name, current_quantity, threshold

**Use Case**: Restaurant gets notified when products need reordering

---

## P1.4 — Auto-Payment Refunds
**Type**: Trigger (Immediate)  
**Event**: Order status → `cancelled` + payment_status = `paid`  
**Action**: Create refund_event with order total amount

**Tables**: `refund_events`, `orders`  
**Refund Fields**: order_id, reason, amount_fcfa, status=pending

**Updates Order**: payment_status → `refund_pending`

**Use Case**: Automatic refund initiation when customers cancel paid orders

---

## P1.5 — Auto-Order Completion
**Type**: Cron Job (Scheduled)  
**Schedule**: `0 2 * * *` (Daily at 2 AM UTC = 3 AM Cameroon UTC+1)  
**Action**: Mark delivered/pickedup orders as completed after 24 hours

**Conditions**:
- Status IN ('delivered', 'pickedup')
- Last update > 24 hours ago
- Not already completed (completed_at IS NULL)

**Updates**: status → `completed`, sets `completed_at`

**Use Case**: Auto-archive completed orders for cleaner dashboard and metrics

---

## Schema Changes

### orders table
- ADD `completed_at` TIMESTAMP WITH TIME ZONE

### stock table  
- ADD `low_stock_threshold` INTEGER DEFAULT 5

### refund_events table
- ADD `order_id` UUID REFERENCES orders(id)
- ADD `reason` TEXT
- ADD `amount_fcfa` INTEGER

### Indexes Created
- `idx_stock_product_quantity` — for inventory queries
- `idx_orders_status_updated` — for status updates
- `idx_refund_events_order_id` — for refund lookups

---

## Verification Checklist

- [x] P1.1: Trigger `trg_create_kds_notification` created on orders table
- [x] P1.2: Trigger `trg_decrement_inventory_on_payment` created on orders table
- [x] P1.3: Trigger `trg_check_low_stock` created on stock table
- [x] P1.4: Trigger `trg_create_refund_on_cancellation` created on orders table
- [x] P1.5: Cron job `auto-complete-orders` scheduled daily at 2 AM UTC
- [x] All schema columns added
- [x] All indexes created
- [x] Migrations applied via Supabase MCP
