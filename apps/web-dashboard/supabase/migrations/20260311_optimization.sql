-- ============================================================
-- KBOUFFE — Supabase Optimization (Security & Performance)
-- Date: 2026-03-11
-- ============================================================

-- 1. Security: Functional Hardening
-- Prevent potential search_path escalation by locking functions to 'public'
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.slugify(text) SET search_path = public;

-- 2. Performance: Indexing Foreign Keys
-- Ensure join target columns are indexed to optimize relationship traversal
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS conversations_order_id_idx ON public.conversations(order_id);
CREATE INDEX IF NOT EXISTS conversations_restaurant_id_idx ON public.conversations(restaurant_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS orders_table_id_idx ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS payout_items_order_id_idx ON public.payout_items(order_id);
CREATE INDEX IF NOT EXISTS payout_items_payment_transaction_id_idx ON public.payout_items(payment_transaction_id);
CREATE INDEX IF NOT EXISTS reservations_pre_order_id_idx ON public.reservations(pre_order_id);
CREATE INDEX IF NOT EXISTS reservations_table_id_idx ON public.reservations(table_id);
CREATE INDEX IF NOT EXISTS reviews_customer_id_idx ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS menu_item_options_product_id_idx ON public.menu_item_options(product_id);
CREATE INDEX IF NOT EXISTS menu_item_option_values_option_id_idx ON public.menu_item_option_values(option_id);

-- 3. Security/Performance: Restore & Optimize RLS Policies
-- Using (SELECT auth.uid()) ensures the value is cached during row-level evaluation (InitPlan).

-- TABLE: users
DROP POLICY IF EXISTS "users: lecture propre profil" ON public.users;
CREATE POLICY "users: lecture propre profil" ON public.users FOR SELECT USING ((SELECT auth.uid()) = id);
DROP POLICY IF EXISTS "users: modification propre profil" ON public.users;
CREATE POLICY "users: modification propre profil" ON public.users FOR UPDATE USING ((SELECT auth.uid()) = id);

-- TABLE: restaurants
DROP POLICY IF EXISTS "restaurants: propriétaire CRUD" ON public.restaurants;
CREATE POLICY "restaurants: propriétaire CRUD" ON public.restaurants FOR ALL USING ((SELECT auth.uid()) = owner_id);
DROP POLICY IF EXISTS "restaurants: lecture publique si publié" ON public.restaurants;
CREATE POLICY "restaurants: lecture publique si publié" ON public.restaurants FOR SELECT USING (is_published = true);

-- TABLE: categories
DROP POLICY IF EXISTS "categories: propriétaire CRUD" ON public.categories;
CREATE POLICY "categories: propriétaire CRUD" ON public.categories FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = categories.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "categories: lecture publique" ON public.categories;
CREATE POLICY "categories: lecture publique" ON public.categories FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = categories.restaurant_id AND restaurants.is_published = true));

-- TABLE: products
DROP POLICY IF EXISTS "products: propriétaire CRUD" ON public.products;
CREATE POLICY "products: propriétaire CRUD" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = products.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "products: lecture publique" ON public.products;
CREATE POLICY "products: lecture publique" ON public.products FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = products.restaurant_id AND restaurants.is_published = true));

-- TABLE: orders
DROP POLICY IF EXISTS "orders: lecture par restaurateur" ON public.orders;
CREATE POLICY "orders: lecture par restaurateur" ON public.orders FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "orders: update par restaurateur" ON public.orders;
CREATE POLICY "orders: update par restaurateur" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = orders.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "orders: lecture par client" ON public.orders;
CREATE POLICY "orders: lecture par client" ON public.orders FOR SELECT USING ((SELECT auth.uid()) = customer_id);
DROP POLICY IF EXISTS "orders: insertion publique" ON public.orders;
CREATE POLICY "orders: insertion publique" ON public.orders FOR INSERT WITH CHECK (true);

-- TABLE: reviews
DROP POLICY IF EXISTS "reviews: lecture publique" ON public.reviews;
CREATE POLICY "reviews: lecture publique" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "reviews: insertion par client" ON public.reviews;
CREATE POLICY "reviews: insertion par client" ON public.reviews FOR INSERT WITH CHECK ((SELECT auth.uid()) = customer_id);

-- TABLE: payouts
DROP POLICY IF EXISTS "payouts: lecture par restaurateur" ON public.payouts;
CREATE POLICY "payouts: lecture par restaurateur" ON public.payouts FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = payouts.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));

-- TABLE: payment_transactions
DROP POLICY IF EXISTS "payment_transactions: owner CRUD" ON public.payment_transactions;
CREATE POLICY "payment_transactions: owner CRUD" ON public.payment_transactions FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = payment_transactions.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));

-- TABLE: ledger_entries
DROP POLICY IF EXISTS "ledger_entries: owner read" ON public.ledger_entries;
CREATE POLICY "ledger_entries: owner read" ON public.ledger_entries FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = ledger_entries.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));

-- TABLE: payout_items
DROP POLICY IF EXISTS "payout_items: owner read" ON public.payout_items;
CREATE POLICY "payout_items: owner read" ON public.payout_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants WHERE restaurants.id = payout_items.restaurant_id AND restaurants.owner_id = (SELECT auth.uid())));

-- TABLE: store_modules
DROP POLICY IF EXISTS "store_modules_owner_access" ON public.store_modules;
CREATE POLICY "store_modules_owner_access" ON public.store_modules FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = store_modules.restaurant_id AND r.owner_id = (SELECT auth.uid())));

-- TABLE: settings
DROP POLICY IF EXISTS "settings_owner_access" ON public.settings;
CREATE POLICY "settings_owner_access" ON public.settings FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = settings.restaurant_id AND r.owner_id = (SELECT auth.uid())));

-- TABLE: conversations
DROP POLICY IF EXISTS "conversations_access" ON public.conversations;
CREATE POLICY "conversations_access" ON public.conversations FOR ALL USING ((EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.user_id = (SELECT auth.uid()))) OR (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = conversations.restaurant_id AND r.owner_id = (SELECT auth.uid()))));

-- TABLE: conversation_participants
DROP POLICY IF EXISTS "conversation_participants_access" ON public.conversation_participants;
CREATE POLICY "conversation_participants_access" ON public.conversation_participants FOR SELECT USING ((EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = (SELECT auth.uid()))) OR (EXISTS (SELECT 1 FROM public.restaurants r JOIN public.conversations c ON c.restaurant_id = r.id WHERE c.id = conversation_participants.conversation_id AND r.owner_id = (SELECT auth.uid()))));

-- TABLE: messages
DROP POLICY IF EXISTS "messages_access" ON public.messages;
CREATE POLICY "messages_access" ON public.messages FOR ALL USING ((EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = (SELECT auth.uid()))) OR (EXISTS (SELECT 1 FROM public.restaurants r JOIN public.conversations c ON c.restaurant_id = r.id WHERE c.id = messages.conversation_id AND r.owner_id = (SELECT auth.uid()))));
