-- Fase 4: behandelingen (services) en website-instellingen (site_settings).
-- Idempotent: opnieuw uitvoeren maakt geen dubbele rijen en overschrijft geen wijzigingen van de eigenares.

-- 1. Tabellen -----------------------------------------------------------------

create table if not exists public.services (
  id text primary key,
  category_id text not null check (category_id in ('nails', 'waxing', 'hair')),
  group_name text,
  title text not null check (btrim(title) <> ''),
  sort_order int not null default 0,
  is_active boolean not null default true,
  -- Vaste prijs en duur. Leeg bij behandelingen die per lengte verschillen.
  price_euro int check (price_euro is null or price_euro >= 0),
  active_duration_min int check (active_duration_min is null or active_duration_min > 0),
  processing_duration_min int not null default 0 check (processing_duration_min >= 0),
  -- Per lengte: {"short": {...}, "medium": {...}, "long": {...}}, elk met price_euro, active_duration_min en processing_duration_min.
  length_pricing jsonb,
  constraint services_pricing_chk check (
    (length_pricing is null and price_euro is not null and active_duration_min is not null)
    or (
      length_pricing is not null
      and price_euro is null
      and active_duration_min is null
      and length_pricing ?& array['short', 'medium', 'long']
    )
  )
);

create table if not exists public.site_settings (
  key text primary key check (btrim(key) <> ''),
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- 2. RLS en kolomrechten ------------------------------------------------------

alter table public.services enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.services, public.site_settings from anon, authenticated;
grant select on public.services, public.site_settings to anon, authenticated;
grant insert, update, delete on public.services, public.site_settings to authenticated;

drop policy if exists "services: iedereen leest" on public.services;
create policy "services: iedereen leest"
  on public.services for select to anon, authenticated
  using (true);

drop policy if exists "services: admin beheert" on public.services;
create policy "services: admin beheert"
  on public.services for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "site_settings: iedereen leest" on public.site_settings;
create policy "site_settings: iedereen leest"
  on public.site_settings for select to anon, authenticated
  using (true);

drop policy if exists "site_settings: admin beheert" on public.site_settings;
create policy "site_settings: admin beheert"
  on public.site_settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Seed: prijslijst uit lib/treatments.ts (Fase 1) ----------------------------
-- on conflict do nothing: bestaande rijen, inclusief aanpassingen van de eigenares, blijven staan.

insert into public.services
  (id, category_id, group_name, title, sort_order, price_euro, active_duration_min, processing_duration_min)
values
  -- Nagels
  ('gelnagels-nieuwe-set', 'nails', 'Gelnagels', 'Gelnagels nieuwe set', 1, 55, 90, 0),
  ('gelnagels-nieuwe-set-verlenging', 'nails', 'Gelnagels', 'Gelnagels nieuwe set + verlenging', 2, 60, 120, 0),
  ('gelnagels-bijwerking-4-weken', 'nails', 'Gelnagels', 'Gelnagels bijwerking (4 weken)', 3, 45, 60, 0),
  ('gelnagels-bijwerking-plus-4-weken', 'nails', 'Gelnagels', 'Gelnagels bijwerking (+4 weken)', 4, 55, 75, 0),
  ('biab-nieuwe-set', 'nails', 'BIAB', 'BIAB nieuwe set', 5, 50, 90, 0),
  ('biab-bijwerking-3-weken', 'nails', 'BIAB', 'BIAB bijwerking (3 weken)', 6, 40, 60, 0),
  ('biab-bijwerking-plus-3-weken', 'nails', 'BIAB', 'BIAB bijwerking (+3 weken)', 7, 45, 75, 0),
  ('biab-kleur-3-weken', 'nails', 'BIAB', 'BIAB + kleur (3 weken)', 8, 45, 75, 0),
  ('biab-kleur-plus-3-weken', 'nails', 'BIAB', 'BIAB + kleur (+3 weken)', 9, 50, 90, 0),
  ('biab-op-tenen', 'nails', 'BIAB', 'BIAB op tenen', 10, 35, 60, 0),
  ('manicure', 'nails', 'Manicure & Verwijderen', 'Manicure', 11, 20, 30, 0),
  ('manicure-lakken', 'nails', 'Manicure & Verwijderen', 'Manicure + lakken', 12, 25, 40, 0),
  ('verwijderen-gelnagels-biab-manicure', 'nails', 'Manicure & Verwijderen', 'Gelnagels/BIAB verwijderen + manicure', 13, 25, 30, 15),
  -- Ontharing
  ('bovenlip', 'waxing', null, 'Bovenlip', 1, 6, 10, 0),
  ('wenkbrauwen', 'waxing', null, 'Wenkbrauwen', 2, 8, 10, 0),
  ('oksels', 'waxing', null, 'Oksels', 3, 14, 15, 0),
  ('bikinilijn', 'waxing', null, 'Bikinilijn', 4, 20, 20, 0),
  ('benen-volledig', 'waxing', null, 'Benen volledig', 5, 40, 45, 0),
  ('onderbenen', 'waxing', null, 'Onderbenen', 6, 22, 25, 0),
  ('bovenbenen', 'waxing', null, 'Bovenbenen', 7, 20, 25, 0)
on conflict (id) do nothing;

insert into public.services
  (id, category_id, group_name, title, sort_order, price_euro, active_duration_min, processing_duration_min)
values
  ('snit', 'hair', 'Snit & Kleuring', 'Snit', 1, 20, 30, 0),
  ('snit-brushing', 'hair', 'Snit & Kleuring', 'Snit + Brushing', 2, 40, 60, 0),
  ('kleur-snit', 'hair', 'Snit & Kleuring', 'Kleur + snit', 3, 55, 45, 35),
  ('kleur-brushing', 'hair', 'Snit & Kleuring', 'Kleur + brushing', 4, 65, 60, 35),
  ('kleur-snit-brushing', 'hair', 'Snit & Kleuring', 'Kleur + snit + brushing', 5, 75, 90, 35)
on conflict (id) do nothing;

insert into public.services
  (id, category_id, group_name, title, sort_order, length_pricing)
values
  ('mesches-volledig', 'hair', 'Technieken & Brushing', 'Mèches volledig', 6,
    '{"short":{"price_euro":70,"active_duration_min":120,"processing_duration_min":30},"medium":{"price_euro":80,"active_duration_min":150,"processing_duration_min":30},"long":{"price_euro":90,"active_duration_min":180,"processing_duration_min":30}}'::jsonb),
  ('mesches-deels', 'hair', 'Technieken & Brushing', 'Mèches deels', 7,
    '{"short":{"price_euro":40,"active_duration_min":90,"processing_duration_min":30},"medium":{"price_euro":50,"active_duration_min":105,"processing_duration_min":30},"long":{"price_euro":60,"active_duration_min":120,"processing_duration_min":30}}'::jsonb),
  ('balayage-volledig', 'hair', 'Technieken & Brushing', 'Balayage volledig', 8,
    '{"short":{"price_euro":60,"active_duration_min":120,"processing_duration_min":30},"medium":{"price_euro":70,"active_duration_min":135,"processing_duration_min":30},"long":{"price_euro":80,"active_duration_min":150,"processing_duration_min":30}}'::jsonb),
  ('balayage-deels', 'hair', 'Technieken & Brushing', 'Balayage deels', 9,
    '{"short":{"price_euro":30,"active_duration_min":75,"processing_duration_min":30},"medium":{"price_euro":40,"active_duration_min":90,"processing_duration_min":30},"long":{"price_euro":50,"active_duration_min":105,"processing_duration_min":30}}'::jsonb),
  ('brushing', 'hair', 'Technieken & Brushing', 'Brushing', 10,
    '{"short":{"price_euro":30,"active_duration_min":30,"processing_duration_min":0},"medium":{"price_euro":35,"active_duration_min":35,"processing_duration_min":0},"long":{"price_euro":40,"active_duration_min":45,"processing_duration_min":0}}'::jsonb)
on conflict (id) do nothing;

-- 4. Seed: mededelingsbanner (uit by default) ----------------------------------

insert into public.site_settings (key, value)
values
  ('announcement_enabled', 'false'),
  ('announcement_text', '')
on conflict (key) do nothing;