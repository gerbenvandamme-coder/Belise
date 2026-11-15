-- Verharding van de boekingsflow.
-- 1. Klanten kunnen niet meer rechtstreeks in public.bookings schrijven. Boeken kan enkel via
--    create_booking, die het tijdslot controleert. Admins behouden hun volledige rechten.
-- 2. create_booking berekent prijs en duur zelf uit public.services. De prijs en de behandelingen
--    die de browser meestuurt, worden niet meer vertrouwd.
-- 3. Een klant kan maximaal 3 onbevestigde (pending) toekomstige boekingen tegelijk hebben.
-- Idempotent: opnieuw uitvoeren geeft geen fout.

drop policy if exists "bookings: klant maakt eigen boeking" on public.bookings;

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
  v_prefix text;
  v_item jsonb;
  v_service public.services;
  v_length text;
  v_price int;
  v_active int;
  v_processing int;
  v_label text;
  v_total_price numeric := 0;
  v_total_min int := 0;
  v_items jsonb := '[]'::jsonb;
  v_open_pending int;
  v_row public.bookings;
begin
  if v_uid is null then
    raise exception 'Je bent niet ingelogd.' using errcode = '42501';
  end if;

  if p_booking_id is null or p_booking_date is null or p_start_time is null or p_end_time is null
     or p_start_time >= p_end_time then
    raise exception 'Ongeldig tijdslot.' using errcode = '22023';
  end if;

  if p_treatments is null or jsonb_typeof(p_treatments) <> 'array'
     or jsonb_array_length(p_treatments) = 0 or jsonb_array_length(p_treatments) > 6 then
    raise exception 'Kies minstens één behandeling.' using errcode = '22023';
  end if;

  -- Prijs en duur komen uit de tarieven van de salon, niet uit de browser.
  for v_item in select * from jsonb_array_elements(p_treatments) loop
    select * into v_service
    from public.services s
    where s.id = v_item ->> 'id' and s.is_active;

    if not found then
      raise exception 'Deze behandeling is niet (meer) beschikbaar.' using errcode = '22023';
    end if;

    if v_service.length_pricing is null then
      v_length := null;
      v_price := v_service.price_euro;
      v_active := v_service.active_duration_min;
      v_processing := v_service.processing_duration_min;
      v_label := v_service.title;
    else
      v_length := v_item ->> 'length';
      if v_length is null or v_length not in ('short', 'medium', 'long') then
        raise exception 'Kies een haarlengte voor %.', v_service.title using errcode = '22023';
      end if;
      v_price := (v_service.length_pricing -> v_length ->> 'price_euro')::int;
      v_active := (v_service.length_pricing -> v_length ->> 'active_duration_min')::int;
      v_processing := coalesce((v_service.length_pricing -> v_length ->> 'processing_duration_min')::int, 0);
      v_label := v_service.title || ' (' ||
        case v_length when 'short' then 'Kort' when 'medium' then 'Midden' else 'Lang' end || ')';
    end if;

    v_total_price := v_total_price + v_price;
    v_total_min := v_total_min + v_active + v_processing;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', v_service.id,
      'title', v_service.title,
      'label', v_label,
      'length', v_length,
      'price_euro', v_price,
      'duration_min', v_active + v_processing
    ));
  end loop;

  if v_total_min not between 15 and 480 then
    raise exception 'Ongeldige duur.' using errcode = '22023';
  end if;

  -- Het eindtijdstip moet kloppen met de berekende duur.
  if p_end_time <> p_start_time + make_interval(mins => v_total_min) then
    raise exception 'De duur van je afspraak is gewijzigd. Herlaad de pagina en kies opnieuw.'
      using errcode = '22023';
  end if;

  -- Foto's moeten staan in de eigen map van de klant, bij deze boeking.
  v_prefix := v_uid::text || '/' || p_booking_id::text || '/';
  if p_reference_now_path is not null and p_reference_now_path <> v_prefix || 'now.webp' then
    raise exception 'Ongeldig pad voor referentiefoto.' using errcode = '22023';
  end if;
  if p_inspiration_path is not null and p_inspiration_path <> v_prefix || 'inspiration.webp' then
    raise exception 'Ongeldig pad voor inspiratiefoto.' using errcode = '22023';
  end if;

  -- Beperk spam: maximaal 3 onbevestigde toekomstige afspraken per klant.
  select count(*) into v_open_pending
  from public.bookings b
  where b.client_id = v_uid
    and b.status = 'pending'
    and b.booking_date >= (now() at time zone 'Europe/Brussels')::date;

  if v_open_pending >= 3 then
    raise exception 'Je hebt al 3 afspraken die nog bevestigd moeten worden. Neem contact op met de salon.'
      using errcode = 'P0001';
  end if;

  -- Serialiseer aanvragen per dag, zodat twee gelijktijdige boekingen niet samen slagen.
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text, 0));

  if not exists (
    select 1
    from public.get_available_slots(p_booking_date, v_total_min) as s
    where s.slot_time = p_start_time
  ) then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001', hint = 'Kies een ander tijdslot.';
  end if;

  insert into public.bookings (
    id, client_id, treatments, booking_date, start_time, end_time, total_price,
    status, reference_now_path, inspiration_path, photo_social_consent, client_notes
  )
  values (
    p_booking_id, v_uid, v_items, p_booking_date, p_start_time, p_end_time, v_total_price,
    'pending', p_reference_now_path, p_inspiration_path,
    coalesce(p_photo_social_consent, false),
    nullif(left(btrim(coalesce(p_client_notes, '')), 1000), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.create_booking(uuid, date, time, time, jsonb, numeric, text, text, text, boolean)
  from public, anon;
grant execute on function public.create_booking(uuid, date, time, time, jsonb, numeric, text, text, text, boolean)
  to authenticated;
