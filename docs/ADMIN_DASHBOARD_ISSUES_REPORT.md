# 🔍 Diagnostic: Admin Dashboard Issues - KBouffe

**Date**: 2026-03-27
**Status**: CRITICAL - Dashboard functionality blocked
**User**: Super Admin

---

## 🚨 Issues Identified

### Issue #1: Menu Incomplet (Menu Items Not Displaying)
**Severity**: HIGH
**Location**: `/admin` page
**Affected Component**: `AdminSidebar.tsx` (line 60-65)

#### Root Cause
La barre latérale filtre les éléments de menu en fonction des permissions. Le problème est dans la logique:

```typescript
// AdminSidebar.tsx line 60-65
const navItems = adminNavItemsDef.filter((item) => {
    if (!item.permission) return true;
    if (!adminRole) return false; // ❌ BLOCKS ALL ITEMS WITH PERMISSIONS!
    return can(item.permission);
});
```

**Problème**: Lorsque `adminRole` est `null`, TOUS les éléments de menu qui requièrent des permissions sont cachés, y compris les éléments essentiels comme:
- Users
- Orders
- Billing
- Marketing
- etc.

#### Why adminRole is NULL
1. Le `AdminProvider` essaie de charger le rôle depuis `/api/admin/profile`
2. L'API retourne `adminRole` depuis `c.get("adminRole")`
3. Le middleware admin défini:
```typescript
// middleware/admin.ts line 45
c.set("adminRole", (dbUser.admin_role as AdminRole) ?? null);
```

**Problème potentiel**: La colonne `admin_role` dans la table `users` est probablement:
- NULL pour le super-admin
- N'existe pas ou n'est pas remplie correctement
- Le middleware retourne `null`, ce qui bloque toutes les permissions

---

### Issue #2: Restaurant List Not Displaying
**Severity**: CRITICAL
**Location**: `/admin/restaurants`
**Affected Component**: `restaurants/page.tsx` (line 92)

#### Root Cause
La page appelle `/api/admin/restaurants?...` pour charger les restaurants:

```typescript
// restaurants/page.tsx line 92
const res = await adminFetch(`/api/admin/restaurants?${params}`);
```

#### Possible Causes

**A. Permission Denied (Most Likely)**
```typescript
// restaurants.ts line 8-10
adminRestaurantsRoutes.get("/", async (c) => {
    const denied = requireDomain(c, "restaurants:read");
    if (denied) return denied; // ❌ BLOCKS ENTIRE RESPONSE
    // ...
});
```

**B. adminRole is NULL**
If `adminRole` is null in context, `requireDomain()` will fail because:
```typescript
// admin-rbac.ts
function hasAdminPermission(role: AdminRole | null, permission: string): boolean {
    if (!role) return false; // ❌ NULL ROLE = NO PERMISSIONS
    // ...
}
```

**C. Network/API Error**
- Check browser console for `/api/admin/restaurants` response
- Error might be: "403 Forbidden" or "401 Unauthorized"

---

## 📋 Solution Map

### Solution #1: Fix AdminRole in Database & Middleware

#### Step 1a: Verify admin_role Column
```sql
-- Check if column exists and has a value
SELECT id, email, role, admin_role FROM users WHERE role = 'admin' LIMIT 5;
```

#### Step 1b: Set admin_role for Super-Admin
```sql
-- Update the super-admin user with the correct admin_role
UPDATE users
SET admin_role = 'super_admin'
WHERE id = '<!-- YOUR_SUPER_ADMIN_USER_ID -->'
AND role = 'admin';
```

#### Step 1c: Fix Middleware (Safety Check)
Update `middleware/admin.ts` to provide a default role:

```typescript
// OLD (line 45):
c.set("adminRole", (dbUser.admin_role as AdminRole) ?? null);

// NEW - Provide default role for admins without explicit role:
c.set("adminRole", (dbUser.admin_role as AdminRole) ?? "super_admin");
```

---

### Solution #2: Fix Menu Display Logic

Update `AdminSidebar.tsx` to show critical menu items even if role is loading:

```typescript
// OLD (line 60-65):
const navItems = adminNavItemsDef.filter((item) => {
    if (!item.permission) return true;
    if (!adminRole) return false; // ❌ BLOCKS ALL
    return can(item.permission);
});

// NEW - Show items while loading:
const navItems = adminNavItemsDef.filter((item) => {
    if (!item.permission) return true;
    // If admin role is loading, show all items (they'll be hidden by API if not allowed)
    if (!adminRole) return true; // ✅ Show all items during loading
    return can(item.permission);
});
```

OR (Better approach):

```typescript
// Show critical items even without explicit permission check
const navItems = adminNavItemsDef.filter((item) => {
    // Always show dashboard, restaurants, and users
    if (["dashboard", "restaurants", "users"].includes(item.labelKey)) return true;

    // For other items, check permissions
    if (!item.permission) return true;
    if (!adminRole) return false;
    return can(item.permission);
});
```

---

### Solution #3: Add Error Handling in AdminProvider

Update `AdminProvider.tsx` to log errors:

```typescript
// After line 54, add:
if (!dbAdminRole) {
    console.warn("Admin role not found in database. Using default 'super_admin'.");
    // Fallback to super_admin if no explicit role
    updateProfile({ adminRole: "super_admin" });
}
```

---

## 🧪 Testing Checklist

After applying fixes:

1. **Browser DevTools**
   - [ ] Open Network tab
   - [ ] Check `/api/admin/profile` response
   - [ ] Verify `adminRole` is set (should be "super_admin" or similar)
   - [ ] Check `/api/admin/restaurants` returns 200 OK with restaurant data

2. **Menu Verification**
   - [ ] Refresh `/admin` page
   - [ ] Verify all 17 menu items appear:
     * Dashboard
     * Restaurants
     * Users
     * Orders
     * Moderation
     * Billing
     * Subscriptions
     * Onboarding
     * Marketing
     * Marketplace
     * AI Usage
     * Broadcast
     * Social Monitor
     * Cuisine Categories
     * Support
     * Audits
     * Settings

3. **Restaurant List**
   - [ ] Navigate to `/admin/restaurants`
   - [ ] Verify restaurant table loads
   - [ ] Search, filter, and paginate work correctly
   - [ ] Can toggle restaurant status and verification

---

## 🔧 Files to Modify

1. **Priority 1 - Critical**
   - `apps/api/src/middleware/admin.ts` (line 45)
   - Database migration or direct SQL update for `admin_role` column

2. **Priority 2 - Important**
   - `apps/web-dashboard/src/components/admin/layout/AdminSidebar.tsx` (line 60-65)
   - `apps/web-dashboard/src/components/providers/AdminProvider.tsx` (line 40-55)

3. **Priority 3 - Nice to Have**
   - Add detailed logging for debugging
   - Add fallback UI for loading state
   - Add validation for admin_role values

---

## 📝 Implementation Steps

### Quick Fix (10 minutes)
1. Execute SQL: Update `admin_role` to 'super_admin'
2. Restart API server
3. Test in browser

### Proper Fix (30 minutes)
1. Update middleware to provide default role
2. Update AdminSidebar to show menu items during loading
3. Test all menu items
4. Test restaurant list endpoint
5. Verify permissions still work correctly

---

## 🎯 Expected Outcome

After fixes:
- ✅ All 17 menu items visible in sidebar
- ✅ Restaurant list displays with pagination, search, and filters
- ✅ Admin can toggle restaurant status and verification
- ✅ Admin can delete restaurants
- ✅ Admin can impersonate restaurant owners
- ✅ All admin endpoints return data correctly
