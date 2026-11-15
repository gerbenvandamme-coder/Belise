-- Portfolio: herkenning van uitgeknipte PNG's. De kaderkeuze per categorie staat in site_settings
-- (sleutels portfolio_frame_nails / _hair / _waxing / _massage, waarde 'true' of 'false'; geen rij = geen kader).
-- Draai dit NA 20261115_portfolio_and_messages.sql. Idempotent.

alter table public.portfolio_items
  add column if not exists has_transparency boolean not null default false;
