-- Atomic reservation status and table management
CREATE OR REPLACE FUNCTION update_reservation_atomic(
  p_res_id uuid,
  p_status text,
  p_table_id uuid DEFAULT NULL,
  p_update_table_id boolean DEFAULT false
)
RETURNS void AS $$
DECLARE
  v_actual_old_table_id uuid;
  v_actual_new_table_id uuid;
BEGIN
  -- Get old table_id
  SELECT table_id INTO v_actual_old_table_id FROM reservations WHERE id = p_res_id;

  -- Determine new table_id
  IF p_update_table_id THEN
    v_actual_new_table_id := p_table_id;
  ELSE
    v_actual_new_table_id := v_actual_old_table_id;
  END IF;

  -- 1. Reset old table if it's different or if status is cancelling assignment
  IF v_actual_old_table_id IS NOT NULL AND (v_actual_old_table_id <> v_actual_new_table_id OR p_status IN ('cancelled', 'no_show', 'completed')) THEN
    UPDATE restaurant_tables SET status = 'available' WHERE id = v_actual_old_table_id;
  END IF;

  -- 2. Update reservation
  UPDATE reservations
  SET 
    status = p_status,
    table_id = v_actual_new_table_id,
    updated_at = NOW()
  WHERE id = p_res_id;

  -- 3. Update new table if status is active
  IF v_actual_new_table_id IS NOT NULL AND p_status IN ('confirmed', 'seated') THEN
    UPDATE restaurant_tables 
    SET status = CASE WHEN p_status = 'seated' THEN 'occupied' ELSE 'reserved' END
    WHERE id = v_actual_new_table_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Table count maintenance
CREATE OR REPLACE FUNCTION increment_total_tables(rid uuid)
RETURNS void AS $$
BEGIN
  UPDATE restaurants
  SET total_tables = COALESCE(total_tables, 0) + 1
  WHERE id = rid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_total_tables(rid uuid)
RETURNS void AS $$
BEGIN
  UPDATE restaurants
  SET total_tables = GREATEST(COALESCE(total_tables, 0) - 1, 0)
  WHERE id = rid;
END;
$$ LANGUAGE plpgsql;
