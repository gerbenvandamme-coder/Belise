-- Belise: klantprofielen, boekingen, RLS en privé opslag voor referentiefoto's.
-- Idempotent: opnieuw uitvoeren geeft geen fout en past bestaande objecten aan.

-- 1. Tabellen -----------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  full_name text not null check (btrim(full_name) <> ''),
  email text not null,
  phone text,
  allergies text,
  allergy_consent_at timestamptz,
  terms_accepted_at timestamptz not null,
  hair_color_formula text,
  nail_preferences text,
  internal_notes text,
  created_at timestamptz not null default now(),
  constraint profiles_allergy_consent_chk
    check (allergies is null or allergy_consent_at is not null)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete set null,
  treatments jsonb not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  total_price numeric(10, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  reference_now_path text,
  inspiration_path text,
  photo_social_consent boolean not null default false,
  client_notes text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

-- 2. Hulpfuncties en triggers -------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Maakt een profiel aan bij registratie. De rol is altijd 'client', ook als de metadata iets anders zegt.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name_value text := btrim(coalesce(meta ->> 'full_name', ''));
  allergy_text text := nullif(btrim(coalesce(meta ->> 'allergies', '')), '');
  consent_at timestamptz := nullif(meta ->> 'allergy_consent_at', '')::timestamptz;
  terms_at timestamptz := nullif(meta ->> 'terms_accepted_at', '')::timestamptz;
begin
  if terms_at is null then
    raise exception 'Akkoord met de algemene voorwaarden ontbreekt.';
  end if;

  if full_name_value = '' then
    raise exception 'Volledige naam is verplicht.';
  end if;

  if allergy_text is not null and consent_at is null then
    raise exception 'Toestemming voor het bewaren van allergieën ontbreekt.';
  end if;

  insert into public.profiles (
    id, role, full_name, email, phone,
    allergies, allergy_consent_at, terms_accepted_at
  )
  values (
    new.id,
    'client',
    full_name_value,
    coalesce(new.email, ''),
    nullif(btrim(coalesce(meta ->> 'phone', '')), ''),
    allergy_text,
    case when allergy_text is null then null else consent_at end,
    terms_at
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Klanten mogen interne velden en wettelijke bewijsvelden niet wijzigen. Admins mogen alles.
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
    or new.terms_accepted_at is distinct from old.terms_accepted_at
    or new.created_at is distinct from old.created_at then
    raise exception 'Deze gegevens kun je niet zelf wijzigen.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Recht op vergetelheid (art. 17 AVG). Verwijdert de auth-gebruiker; het profiel volgt via cascade.
-- Bestanden in storage worden hier niet verwijderd, zie de toelichting bij de app-code.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Je bent niet ingelogd.';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

-- 3. Views --------------------------------------------------------------------

-- Klant-UI: zonder interne salonvelden. security_invoker laat de RLS van profiles gelden.
create or replace view public.client_own_profile
with (security_invoker = true) as
select
  id,
  role,
  full_name,
  email,
  phone,
  allergies,
  allergy_consent_at,
  terms_accepted_at,
  created_at
from public.profiles;

-- Admin-UI: alle kolommen, alleen voor admins. De view draait als eigenaar en filtert op is_admin().
create or replace view public.admin_profiles as
select * from public.profiles
where public.is_admin();

-- 4. Kolomrechten -------------------------------------------------------------
-- Klanten lezen de interne kolommen niet rechtstreeks. Admins lezen die via admin_profiles.

revoke all on public.profiles from anon, authenticated;
grant select (
  id, role, full_name, email, phone, allergies,
  allergy_consent_at, terms_accepted_at, created_at
) on public.profiles to authenticated;
grant update (
  full_name, email, phone, allergies, allergy_consent_at,
  role, internal_notes, hair_color_formula, nail_preferences
) on public.profiles to authenticated;
grant insert, delete on public.profiles to authenticated;

revoke all on public.bookings from anon, authenticated;
grant select, insert, update, delete on public.bookings to authenticated;

revoke all on public.client_own_profile, public.admin_profiles from anon;
grant select on public.client_own_profile to authenticated;
grant select on public.admin_profiles to authenticated;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 5. RLS-policies op profiles en bookings ------------------------------------

drop policy if exists "profiles: klant leest eigen rij" on public.profiles;
create policy "profiles: klant leest eigen rij"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles: klant past eigen rij aan" on public.profiles;
create policy "profiles: klant past eigen rij aan"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles: admin beheert alle rijen" on public.profiles;
create policy "profiles: admin beheert alle rijen"
  on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "bookings: klant leest eigen boekingen" on public.bookings;
create policy "bookings: klant leest eigen boekingen"
  on public.bookings for select to authenticated
  using (client_id = auth.uid());

drop policy if exists "bookings: klant maakt eigen boeking" on public.bookings;
create policy "bookings: klant maakt eigen boeking"
  on public.bookings for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists "bookings: admin beheert alle boekingen" on public.bookings;
create policy "bookings: admin beheert alle boekingen"
  on public.bookings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Privé storage-bucket voor referentiefoto's -------------------------------
-- Pad: {user_id}/{booking_id}/{bestandsnaam}

insert into storage.buckets (id, name, public)
values ('booking-references', 'booking-references', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "booking-references: klant uploadt in eigen map" on storage.objects;
create policy "booking-references: klant uploadt in eigen map"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'booking-references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "booking-references: klant leest eigen map" on storage.objects;
create policy "booking-references: klant leest eigen map"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'booking-references'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "booking-references: admin leest alles" on storage.objects;
create policy "booking-references: admin leest alles"
  on storage.objects for select to authenticated
  using (bucket_id = 'booking-references' and public.is_admin());

drop policy if exists "booking-references: admin verwijdert alles" on storage.objects;
create policy "booking-references: admin verwijdert alles"
  on storage.objects for delete to authenticated
  using (bucket_id = 'booking-references' and public.is_admin());