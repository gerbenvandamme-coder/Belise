-- Whitelist-beschikbaarheid. Standaard is alles gesloten.
-- Idempotent: opnieuw uitvoeren geeft geen fout.

-- 1. Tabellen -----------------------------------------------------------------

create table if not exists public.weekly_availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null unique check (day_of_week between 0 and 6),
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  is_active boolean not null default false,
  constraint weekly_availability_window_chk check (start_time < end_time)
);

create table if not exists public.date_overrides (
  id uuid primary key default gen_random_uuid(),
  specific_date date not null unique,
  is_available boolean not null,
  start_time time,
  end_time time,
  note text,
  constraint date_overrides_window_chk check (
    is_available = false
    or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

alter table public.weekly_availability enable row level security;
alter table public.date_overrides enable row level security;

-- 2. Rechten en RLS -----------------------------------------------------------

revoke all on public.weekly_availability, public.date_overrides from anon, authenticated;
grant select on public.weekly_availability, public.date_overrides to anon, authenticated;
grant insert, update, delete on public.weekly_availability, public.date_overrides to authenticated;

drop policy if exists "weekly_availability: iedereen leest" on public.weekly_availability;
create policy "weekly_availability: iedereen leest"
  on public.weekly_availability for select to anon, authenticated
  using (true);

drop policy if exists "weekly_availability: admin beheert" on public.weekly_availability;
create policy "weekly_availability: admin beheert"
  on public.weekly_availability for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "date_overrides: iedereen leest" on public.date_overrides;
create policy "date_overrides: iedereen leest"
  on public.date_overrides for select to anon, authenticated
  using (true);

drop policy if exists "date_overrides: admin beheert" on public.date_overrides;
create policy "date_overrides: admin beheert"
  on public.date_overrides for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Beschikbare starttijden --------------------------------------------------
-- Geeft enkel starttijden terug. Klantgegevens van boekingen verlaten de database niet.
-- Bufferminuten komen overeen met lib/bookings/availability.ts (BUFFER_MINUTES = 15).

create or replace function public.get_available_slots(p_date date, p_duration_min int)
returns table (slot_time time)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_avail boolean;
  v_open time;
  v_close time;
  v_buffer interval := interval '15 minutes';
  v_duration interval;
begin
  if p_date is null or p_duration_min is null or p_duration_min not between 15 and 480 then
    raise exception 'Ongeldige datum of duur.' using errcode = '22023';
  end if;

  v_duration := make_interval(mins => p_duration_min);

  -- Stap 1: een datum-uitzondering gaat voor op het vaste weekrooster.
  select o.is_available, o.start_time, o.end_time
    into v_avail, v_open, v_close
  from public.date_overrides o
  where o.specific_date = p_date;

  if found then
    if not v_avail then
      return;
    end if;
  else
    -- Stap 2: geen uitzondering, dus het weekrooster bepaalt de dag.
    select w.start_time, w.end_time
      into v_open, v_close
    from public.weekly_availability w
    where w.day_of_week = extract(dow from p_date)::int
      and w.is_active;

    if not found then
      return;
    end if;
  end if;

  -- Stap 3 en 4: kandidaat-slots in het venster, zonder overlap met actieve boekingen.
  return query
  select candidate.slot_start::time
  from generate_series(
    p_date + v_open,
    p_date + v_close - v_duration,
    interval '15 minutes'
  ) as candidate(slot_start)
  where candidate.slot_start >= (now() at time zone 'Europe/Brussels')
    and not exists (
      select 1
      from public.bookings b
      where b.booking_date = p_date
        and b.status in ('pending', 'confirmed')
        and candidate.slot_start < (p_date + b.end_time) + v_buffer
        and candidate.slot_start + v_duration + v_buffer > (p_date + b.start_time)
    )
  order by candidate.slot_start;
end;
$$;

revoke execute on function public.get_available_slots(date, int) from public, anon;
grant execute on function public.get_available_slots(date, int) to anon, authenticated;