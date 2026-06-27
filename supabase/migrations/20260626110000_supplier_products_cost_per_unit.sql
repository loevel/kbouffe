-- Real unit cost for suppliers, in FCFA. Nullable: when NULL the analytics
-- fall back to a 60% heuristic. Enables exact margin/ROI/COGS instead of an
-- estimate.
ALTER TABLE public.supplier_products
  ADD COLUMN IF NOT EXISTS cost_per_unit integer;

COMMENT ON COLUMN public.supplier_products.cost_per_unit IS
  'Coût de revient par unité (FCFA). NULL = inconnu → marge estimée à 60% du prix.';
