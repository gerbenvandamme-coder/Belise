-- Portfolio (foto's per categorie met tags) en berichten van klanten aan de salon.
-- Draai dit NA 20261115_nail_design_and_massage.sql. Idempotent.

-- 1. Portfolio --------------------------------------------------------------------

-- Tags: kleine letters, zonder spaties rond, max 30 tekens, max 12 per foto.
create or replace function public.is_valid_tag_list(p text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(p), 0) <= 12
    and not exists (
      select 1 from unnest(coalesce(p, '{}')) as t(tag)
      where tag is null or tag <> lower(btrim(tag)) or length(tag) not between 1 and 30
    );
$$;

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category_id text not null check (category_id in ('nails', 'waxing', 'hair', 'massage')),
  image_path text not null unique,
  title text check (title is null or length(title) <= 80),
  tags text[] not null default '{}' check (public.is_valid_tag_list(tags)),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

revoke all on public.portfolio_items from anon, authenticated;
grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;

drop policy if exists "portfolio: iedereen leest gepubliceerde" on public.portfolio_items;
create policy "portfolio: iedereen leest gepubliceerde"
  on public.portfolio_items for select to anon, authenticated
  using (is_published or public.is_admin());

drop policy if exists "portfolio: admin beheert" on public.portfolio_items;
create policy "portfolio: admin beheert"
  on public.portfolio_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Publieke bucket: portfoliofoto's zijn bedoeld om getoond te worden. Enkel admins schrijven.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "portfolio: admin uploadt" on storage.objects;
create policy "portfolio: admin uploadt"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "portfolio: admin wijzigt" on storage.objects;
create policy "portfolio: admin wijzigt"
  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists "portfolio: admin verwijdert" on storage.objects;
create policy "portfolio: admin verwijdert"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());

-- 2. Berichten ---------------------------------------------------------------------

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject text not null check (length(btrim(subject)) between 1 and 120),
  body text not null check (length(btrim(body)) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'read', 'answered')),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Klanten mogen enkel onderwerp en tekst invullen; client_id en status volgen uit de defaults.
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert (subject, body) on public.messages to authenticated;
grant update (status), delete on public.messages to authenticated;

drop policy if exists "messages: klant leest eigen" on public.messages;
create policy "messages: klant leest eigen"
  on public.messages for select to authenticated
  using (client_id = auth.uid());

drop policy if exists "messages: klant verstuurt" on public.messages;
create policy "messages: klant verstuurt"
  on public.messages for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists "messages: admin beheert" on public.messages;
create policy "messages: admin beheert"
  on public.messages for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Anti-spam: maximaal 5 berichten per klant per 24 uur.
create or replace function public.limit_message_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if (
    select count(*) from public.messages m
    where m.client_id = new.client_id and m.created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Je stuurde vandaag al 5 berichten. Probeer morgen opnieuw of bel de salon.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.limit_message_rate();
