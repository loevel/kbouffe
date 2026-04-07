# 🗄️ KBouffe Database — Beverage Categories Structure

## 📊 Current Database Schema

### Table Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CATEGORIES TABLE                              │
├─────────────────────────────────────────────────────────────────────────┤
│ • id (UUID primary key)                                                 │
│ • restaurant_id (FK → restaurants)                                      │
│ • name (TEXT) — "Boisson", "Jus Naturels", "Bières", etc.             │
│ • description (TEXT nullable) — "boissons", "Recettes ancestrales"     │
│ • sort_order (INT default 0) — Display order in menu                   │
│ • is_active (BOOL default true)                                         │
│ • name_i18n (JSONB) — Multilingual names {fr, en, ...}                │
│ • description_i18n (JSONB) — Multilingual descriptions                │
│ • created_at (TIMESTAMPTZ)                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                            1:N Relationship
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            PRODUCTS TABLE                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Core Fields:                                                             │
│ • id (UUID primary key)                                                 │
│ • restaurant_id (FK → restaurants)                                      │
│ • category_id (FK → categories) ◄── Links to beverage category         │
│ • name (TEXT) — "33 Export", "Jus de Foléré", etc.                    │
│ • description (TEXT nullable)                                            │
│ • price (INT) — In FCFA (no decimals) — 800, 500, 700, etc.           │
│ • compare_at_price (INT nullable) — Original price                     │
│ • image_url (TEXT nullable) — R2 image URL                             │
│ • is_available (BOOL) — Can customers order?                           │
│ • sort_order (INT default 0)                                            │
│ • prep_time (INT nullable) — Seconds                                    │
│                                                                          │
│ Variant & Options:                                                      │
│ • options (JSONB) ◄── ⭐ PRODUCT OPTIONS (Size, Volume, Temp)        │
│ • tags (JSONB) — ["beer", "cold", "premium"] for filtering             │
│                                                                          │
│ Attributes & Classification:                                            │
│ • is_alcoholic (BOOL) — Beer, wine, spirits                            │
│ • is_vegan (BOOL)                                                       │
│ • is_gluten_free (BOOL)                                                 │
│ • is_halal (BOOL)                                                       │
│ • allergens (JSONB) — ["nuts", "dairy", ...] for alerts               │
│ • calories (INT nullable)                                                │
│                                                                          │
│ Availability & Restrictions:                                            │
│ • available_from (TIME) — e.g., "10:00:00"                             │
│ • available_to (TIME) — e.g., "23:00:00"                               │
│ • is_dine_in_only (BOOL)                                                │
│ • is_no_delivery (BOOL)                                                 │
│ • dine_in_price (INT nullable) — Different price for table service     │
│ • stock_quantity (INT nullable) — For inventory tracking                │
│ • available_until (TIMESTAMPTZ nullable) — Limited time offer          │
│                                                                          │
│ UI & Engagement:                                                        │
│ • is_featured (BOOL) — Show in featured section                        │
│ • is_limited_edition (BOOL)                                             │
│ • is_bundle (BOOL)                                                      │
│ • name_i18n (JSONB) — Multilingual product names                       │
│ • description_i18n (JSONB)                                              │
│                                                                          │
│ Search & Performance:                                                   │
│ • fts (TSVECTOR) — Full-text search index                              │
│ • created_at, updated_at (TIMESTAMPTZ)                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🥤 Current Beverage Data in Production

### Existing Category

| Category | Sort Order | Description | Product Count | Status |
|---|---|---|---|---|
| **Boisson** | 3 | boissons | 2 | ✅ Active |

### Existing Products (in "Boisson" category)

| Product ID | Name | Price (FCFA) | Alcoholic | Available |
|---|---|---|---|---|
| `58597c00...` | 33 Export | 800 | Yes | ✅ |
| `2eed0fdf...` | Castel Beer | 800 | Yes | ✅ |

---

## 🎯 Mock Data vs Reality Gap

### Mock Data (packages/modules/core/src/ui/lib/mock-data.ts)

Expected structure with **3 distinct categories**:

```
📁 Jus Naturels (Juices) — 5 products
  ├─ Jus de Foléré (500 FCFA)
  ├─ Jus de Gingembre (500 FCFA)
  ├─ Jus de Baobab (600 FCFA)
  ├─ Jus de Corossol (700 FCFA)
  └─ Citronnade Maison (400 FCFA)

📁 Bières (Beers) — 14 products
  ├─ 33 Export (800 FCFA)
  ├─ Castel Beer (800 FCFA)
  ├─ Mutzig (900 FCFA)
  ├─ Beaufort Lager (700 FCFA)
  ├─ Beaufort Light (700 FCFA)
  ├─ Heineken (1000 FCFA)
  ├─ Doppel Munich (900 FCFA)
  ├─ Castle Milk Stout (1000 FCFA)
  ├─ Isenberg (800 FCFA)
  ├─ Chill (800 FCFA)
  ├─ Manyan (700 FCFA) ❌ [UNAVAILABLE]
  ├─ Kadji Beer (800 FCFA)
  ├─ K44 (900 FCFA)
  └─ Bissé (800 FCFA)

📁 Boissons Gazeuses (Sodas) — 5 products
  ├─ Top Ananas (400 FCFA)
  ├─ Top Orange (400 FCFA)
  ├─ Top Grenadine (400 FCFA)
  ├─ Top Pamplemousse (400 FCFA)
  └─ Top Tonic (400 FCFA)
```

### Database Reality

```
📁 Boisson (Generic) — 2 products
  ├─ 33 Export (800 FCFA)
  └─ Castel Beer (800 FCFA)
```

**Gap:** Missing 22 products (juices, sodas, most beers) and no category separation!

---

## 🔑 Product Options Structure (JSONB)

### Format & Schema

Each product has an `options` JSONB field that defines customizable variants:

```jsonb
{
  "options": [
    {
      "name": "Size",                          // Internal identifier
      "label": "Sélectionnez la taille",      // UI label (French)
      "type": "select",                        // "select", "radio", "checkbox"
      "required": true,                        // Can customer skip this?
      "values": [
        {
          "label": "Petit",
          "value": "small",
          "price_modifier": 0                  // Relative to base price
        },
        {
          "label": "Moyen",
          "value": "medium",
          "price_modifier": 50
        },
        {
          "label": "Grand",
          "value": "large",
          "price_modifier": 100
        }
      ]
    }
  ]
}
```

### Beverage-Specific Examples

#### 🥤 Juices (Jus Naturels)

```jsonb
{
  "options": [
    {
      "name": "Size",
      "label": "Taille",
      "type": "select",
      "required": true,
      "values": [
        { "label": "Petit (25cl)", "value": "small", "price_modifier": 0 },
        { "label": "Moyen (50cl)", "value": "medium", "price_modifier": 100 },
        { "label": "Grand (75cl)", "value": "large", "price_modifier": 150 }
      ]
    }
  ]
}
```

#### 🍺 Beers (Bières)

```jsonb
{
  "options": [
    {
      "name": "Volume",
      "label": "Volume",
      "type": "select",
      "required": true,
      "values": [
        { "label": "25cl", "value": "25cl", "price_modifier": 0 },
        { "label": "33cl", "value": "33cl", "price_modifier": 100 },
        { "label": "50cl", "value": "50cl", "price_modifier": 200 },
        { "label": "75cl", "value": "75cl", "price_modifier": 400 }
      ]
    },
    {
      "name": "Temperature",
      "label": "Température",
      "type": "select",
      "required": true,
      "values": [
        { "label": "Glacée (0-4°C)", "value": "ice", "price_modifier": 50 },
        { "label": "Frais (8-12°C)", "value": "cold", "price_modifier": 0 },
        { "label": "Température ambiante", "value": "room", "price_modifier": -50 }
      ]
    }
  ]
}
```

#### 🥤 Sodas (Boissons Gazeuses)

```jsonb
{
  "options": [
    {
      "name": "Volume",
      "label": "Volume",
      "type": "select",
      "required": true,
      "values": [
        { "label": "25cl", "value": "25cl", "price_modifier": 0 },
        { "label": "33cl", "value": "33cl", "price_modifier": 50 },
        { "label": "50cl", "value": "50cl", "price_modifier": 100 },
        { "label": "75cl", "value": "75cl", "price_modifier": 150 }
      ]
    }
  ]
}
```

---

## 📋 Recommended Pack Structure

### Option 1: Flat Structure (Simplest - Current Approach)

**Pros:** Minimal schema changes, all beverages in one category  
**Cons:** No visual separation, poor UX for customers browsing

```
└─ Category: "Boisson"
   └─ All 24 beverages (mixed types)
   └─ UI filtering by tags or product names
```

**Implementation:** Keep current schema, update products with tags like `["beer"]`, `["juice"]`, `["soda"]`

---

### Option 2: Hierarchical with Tags (Recommended)

**Pros:** Clean schema, flexible grouping, fast to implement  
**Cons:** Requires UI logic for tag-based filtering

```
└─ Category: "Boissons & Breuvages" (parent)
   ├─ Products tagged "juice" → Juices subsection
   ├─ Products tagged "beer" → Beers subsection
   └─ Products tagged "soda" → Sodas subsection
```

**Implementation:**
1. Keep single "Boisson" category (or rename to "Boissons & Breuvages")
2. Add tags to each product:
   ```jsonb
   "tags": ["juice", "cold", "natural"]
   "tags": ["beer", "alcoholic", "cameroon"]
   "tags": ["soda", "carbonated", "cold"]
   ```
3. Frontend groups products by tag for display

---

### Option 3: Separate Categories (Most Scalable)

**Pros:** Clean data model, natural filtering, best for growth  
**Cons:** Requires database migration

```
├─ Category: "Jus Naturels" (sort_order: 1)
│  └─ 5 juice products
├─ Category: "Bières" (sort_order: 2)
│  └─ 14 beer products
└─ Category: "Boissons Gazeuses" (sort_order: 3)
   └─ 5 soda products
```

**Implementation:**
1. Create 3 new categories in `categories` table
2. Migrate products from generic "Boisson" to specific categories
3. No schema changes needed

---

## 🛠️ Implementation Checklist

### To Sync Mock Data with Database

- [ ] Create 3 beverage categories (or use Option 2 tags)
  - [ ] "Jus Naturels" (sort_order: 1)
  - [ ] "Bières" (sort_order: 2)
  - [ ] "Boissons Gazeuses" (sort_order: 3)

- [ ] Create 24 beverage products with correct data
  - [ ] 5 juices with size options
  - [ ] 14 beers with volume + temperature options
  - [ ] 5 sodas with volume options

- [ ] Set product attributes
  - [ ] `is_alcoholic = true` for beers only
  - [ ] `tags = ["juice"]`, `["beer"]`, `["soda"]` for filtering
  - [ ] `image_url` for each product
  - [ ] `is_available = false` for Manyan beer only

- [ ] Verify options JSONB structure
  - [ ] Juices: Size option (Petit, Moyen, Grand)
  - [ ] Beers: Volume + Temperature options
  - [ ] Sodas: Volume option

---

## 📈 Database Relationships Summary

```
restaurants (1)
    │
    ├─→ categories (N) [has restaurant_id]
    │       │
    │       └─→ products (N) [has category_id + restaurant_id]
    │               │
    │               ├─→ options (JSONB field, nested)
    │               ├─→ product_images (1:N)
    │               ├─→ product_reviews (1:N)
    │               └─→ product_favorites (1:N by users)
    │
    └─→ users (N)
            └─→ orders (N)
                    └─→ order_items (N)
                            └─→ order_item_options (N) [stores selected options]
```

---

## 🔍 Key Insights

1. **Options are flexible:** Products can have any number of option groups with custom modifiers
2. **Price modifiers:** Secondary options (size, temperature) adjust the base product price
3. **Tags enable filtering:** Instead of hierarchical categories, use tags for flexible grouping
4. **JSONB is powerful:** Allows storing complex variant configurations without schema sprawl
5. **Restaurant-scoped:** Each restaurant can customize their own categories and products

---

## 📌 Files to Update

| File | Change | Reason |
|---|---|---|
| `supabase/migrations/` | Create categories + products | Sync DB with mock data |
| `packages/modules/core/src/ui/lib/mock-data.ts` | Already correct | Reference for DB sync |
| `apps/web-dashboard/src/...` | Add category filtering | UI for beverage browsing |
| `packages/modules/catalog/src/api/` | Filter by category/tags | API endpoint updates |

