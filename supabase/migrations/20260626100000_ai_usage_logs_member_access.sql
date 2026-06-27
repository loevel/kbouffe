-- AI usage logging was owner-only (INSERT/SELECT), so team members' AI calls
-- were never logged → they silently bypassed the per-restaurant daily limits
-- (logAiUsage fails open). Add additive member policies so members are tracked.

CREATE POLICY "ai_usage_member_insert" ON public.ai_usage_logs
  FOR INSERT
  WITH CHECK (auth_is_restaurant_member(restaurant_id));

CREATE POLICY "ai_usage_member_read" ON public.ai_usage_logs
  FOR SELECT
  USING (auth_is_restaurant_member(restaurant_id));
