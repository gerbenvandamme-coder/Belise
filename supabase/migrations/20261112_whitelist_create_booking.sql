-- Boekingen aanmaken via een RPC die het tijdslot opnieuw controleert in dezelfde transactie.
-- Idempotent: opnieuw uitvoeren geeft geen fout.

create or replace function public.create_booking(
  p_booking_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_treatments jsonb,
  p_total_price numeric,
  p_client_notes text,
  p_reference_now_path text,
  p_inspiration_path text,
  p_photo_social_consent boolean
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_duration_min int;
  v_prefix text;
  v_row public.bookings;
begin
  if v_uid is null then
    raise exception 'Je bent niet ingelogd.' using errcode = '42501';
  end if;

  if p_booking_id is null or p_booking_date is null or p_start_time is null or p_end_time is null
     or p_start_time >= p_end_time then
    raise exception 'Ongeldig tijdslot.' using errcode = '22023';
  end if;

  v_duration_min := (extract(epoch from (p_end_time - p_start_time)) / 60)::int;
  if v_duration_min not between 15 and 480 then
    raise exception 'Ongeldige duur.' using errcode = '22023';
  end if;

  if p_treatments is null or jsonb_typeof(p_treatments) <> 'array' or jsonb_array_length(p_treatments) = 0 then
    raise exception 'Kies minstens één behandeling.' using errcode = '22023';
  end if;

  if p_total_price is null or p_total_price < 0 then
    raise exception 'Ongeldige prijs.' using errcode = '22023';
  end if;

  -- Foto's moeten staan in de eigen map van de klant, bij deze boeking.
  v_prefix := v_uid::text || '/' || p_booking_id::text || '/';
  if p_reference_now_path is not null and p_reference_now_path <> v_prefix || 'now.webp' then
    raise exception 'Ongeldig pad voor referentiefoto.' using errcode = '22023';
  end if;
  if p_inspiration_path is not null and p_inspiration_path <> v_prefix || 'inspiration.webp' then
    raise exception 'Ongeldig pad voor inspiratiefoto.' using errcode = '22023';
  end if;

  -- Serialiseer aanvragen per dag, zodat twee gelijktijdige boekingen niet samen slagen.
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text, 0));

  -- Hergebruikt de whitelist-logica: datum-override, weekrooster, bestaande boekingen en buffer.
  if not exists (
    select 1
    from public.get_available_slots(p_booking_date, v_duration_min) as s
    where s.slot_time = p_start_time
  ) then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001', hint = 'Kies een ander tijdslot.';
  end if;

  insert into public.bookings (
    id, client_id, treatments, booking_date, start_time, end_time, total_price,
    status, reference_now_path, inspiration_path, photo_social_consent, client_notes
  )
  values (
    p_booking_id, v_uid, p_treatments, p_booking_date, p_start_time, p_end_time, p_total_price,
    'pending', p_reference_now_path, p_inspiration_path,
    coalesce(p_photo_social_consent, false),
    nullif(btrim(coalesce(p_client_notes, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.create_booking(uuid, date, time, time, jsonb, numeric, text, text, text, boolean)
  from public, anon;
grant execute on function public.create_booking(uuid, date, time, time, jsonb, numeric, text, text, text, boolean)
  to authenticated;