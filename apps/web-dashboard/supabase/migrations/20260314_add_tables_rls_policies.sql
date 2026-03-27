-- Migration: 20260314_add_tables_rls_policies
-- Description: Adds RLS policies to allow restaurant owners to manage their zones and tables.

-- Table Zones: Allow owners to manage their own restaurant's zones
CREATE POLICY "restaurant_owners_manage_zones"
    ON table_zones FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = table_zones.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = table_zones.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );

-- Restaurant Tables: Allow owners to manage their own restaurant's tables
CREATE POLICY "restaurant_owners_manage_tables"
    ON restaurant_tables FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = restaurant_tables.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = restaurant_tables.restaurant_id
            AND restaurants.owner_id = auth.uid()
        )
    );
