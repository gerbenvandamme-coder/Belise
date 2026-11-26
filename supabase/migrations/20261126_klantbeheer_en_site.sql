-- Migratie 9 (26/11/2026), na overleg met de zaakvoerder.
-- Idempotent: opnieuw uitvoeren geeft geen fout.
--  1. Aanbod: BIAB weg, supplement voor nagels van een andere salon.
--  2. Klantenbestand: no-show-teller en fototoestemming.
--  3. Portfolio: foto koppelen aan een klant; publiceren enkel met toestemming.
--  4. Admin wist alle gegevens van een klant (AVG, art. 17).

-- 1. Aanbod ---------------------------------------------------------------------

delete from public.services where id like 'biab-%';

update public.services
set title = 'Gelnagels verwijderen + manicure'
where id = 'verwijderen-gelnagels-biab-manicure' and title = 'Gelnagels/BIAB verwijderen + manicure';

insert into public.services
  (id, category_id, group_name, title, sort_order, price_euro, active_duration_min, processing_duration_min)
values
  ('supplement-andere-salon', 'nails', 'Manicure & Verwijderen',
   'Supplement: nagels van een andere salon verwijderen', 14, 5, 15, 0)
on conflict (id) do nothing;

-- 2. Klantenbestand -------------------------------------------------------------

alter table public.profiles add column if not exists no_show_count int not null default 0;
alter table public.profiles add column if not exists photo_consent boolean not null default false;
alter table public.profiles add column if not exists photo_consent_at timestamptz;

alter table public.profiles drop constraint if exists profiles_no_show_count_chk;
alter table public.profiles add constraint profiles_no_show_count_chk check (no_show_count >= 0);

-- Klanten mogen de nieuwe salonvelden niet zelf wijzigen.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.internal_notes is distinct from old.internal_notes
    or new.hair_color_formula is distinct from old.hair_color_formula
    or new.nail_preferences is distinct from old.nail_preferences
    or new.no_show_count is distinct from old.no_show_count
    or new.photo_consent is distinct from old.photo_consent
    or new.photo_consent_at is distinct from old.photo_consent_at
    or new.terms_accepted_at is distinct from old.terms_accepted_at
    or new.created_at is distinct from old.created_at then
    raise exception 'Deze gegevens kun je niet zelf wijzigen.';
  end if;

  return new;
end;
$$;

-- De admin-view opnieuw opbouwen, zodat de nieuwe kolommen erin zitten.
create or replace view public.admin_profiles as
select * from public.profiles
where public.is_admin();

grant update (no_show_count, photo_consent, photo_consent_at) on public.profiles to authenticated;
revoke all on public.admin_profiles from anon;
grant select on public.admin_profiles to authenticated;

-- Een afspraak als no-show markeren telt automatisch mee; terugzetten telt eraf.
create or replace function public.count_no_show()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.client_id is null or new.status is not distinct from old.status then
    return new;
  end if;
  if new.status = 'no_show' then
    update public.profiles set no_show_count = no_show_count + 1 where id = new.client_id;
  elsif old.status = 'no_show' then
    update public.profiles set no_show_count = greatest(no_show_count - 1, 0) where id = new.client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_count_no_show on public.bookings;
create trigger bookings_count_no_show
  after update of status on public.bookings
  for each row execute function public.count_no_show();

-- 3. Portfolio ------------------------------------------------------------------

alter table public.portfolio_items
  add column if not exists client_id uuid references public.profiles (id) on delete set null;

-- Een foto van een klant zonder fototoestemming kan niet gepubliceerd worden.
create or replace function public.guard_portfolio_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_published and new.client_id is not null and not exists (
    select 1 from public.profiles p where p.id = new.client_id and p.photo_consent
  ) then
    raise exception 'Deze klant gaf geen toestemming om foto''s te delen.';
  end if;
  return new;
end;
$$;

drop trigger if exists portfolio_guard_consent on public.portfolio_items;
create trigger portfolio_guard_consent
  before insert or update on public.portfolio_items
  for each row execute function public.guard_portfolio_consent();

-- Trekt een klant de toestemming in, dan gaan haar foto's meteen offline.
create or replace function public.unpublish_on_consent_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.photo_consent and not new.photo_consent then
    update public.portfolio_items set is_published = false where client_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_consent_withdrawal on public.profiles;
create trigger profiles_consent_withdrawal
  after update of photo_consent on public.profiles
  for each row execute function public.unpublish_on_consent_withdrawal();

-- 4. Klant wissen door de admin ---------------------------------------------------
-- Verwijdert de auth-gebruiker (profiel volgt via cascade), boekingen, berichten en
-- gekoppelde portfoliofoto's. Bestanden in storage verwijdert de app vooraf.
create or replace function public.admin_delete_client(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Enkel de salon kan klantgegevens wissen.';
  end if;
  if p_client_id = auth.uid() then
    raise exception 'Je kunt je eigen beheerdersaccount hier niet wissen.';
  end if;

  delete from public.portfolio_items where client_id = p_client_id;
  delete from public.bookings where client_id = p_client_id;
  delete from public.messages where client_id = p_client_id;
  delete from auth.users where id = p_client_id;
end;
$$;

revoke execute on function public.admin_delete_client(uuid) from public, anon;
grant execute on function public.admin_delete_client(uuid) to authenticated;
