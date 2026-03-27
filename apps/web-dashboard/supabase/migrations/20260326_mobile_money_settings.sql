-- Mobile Money payment settings per restaurant
-- Supports MTN MoMo, Orange Money, and Cash for Cameroon market

create table if not exists restaurant_payment_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  momo_enabled boolean not null default false,
  momo_phone text,
  orange_money_enabled boolean not null default false,
  orange_money_phone text,
  cash_enabled boolean not null default true,
  auto_confirm_payments boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_restaurant_payment_settings unique (restaurant_id)
);

-- Index for fast lookup by restaurant
create index if not exists idx_restaurant_payment_settings_restaurant
  on restaurant_payment_settings(restaurant_id);

-- Enable RLS
alter table restaurant_payment_settings enable row level security;

-- Owner can read their own settings
create policy "Owner can view own payment settings"
  on restaurant_payment_settings for select
  using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

-- Owner can insert their own settings
create policy "Owner can insert own payment settings"
  on restaurant_payment_settings for insert
  with check (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

-- Owner can update their own settings
create policy "Owner can update own payment settings"
  on restaurant_payment_settings for update
  using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

-- Owner can delete their own settings
create policy "Owner can delete own payment settings"
  on restaurant_payment_settings for delete
  using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

-- Auto-update updated_at trigger
create or replace function update_payment_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_payment_settings_updated_at
  before update on restaurant_payment_settings
  for each row
  execute function update_payment_settings_updated_at();
