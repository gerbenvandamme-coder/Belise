/**
 * Demo-client voor showcase-doeleinden. Bootst de gebruikte Supabase-API na met
 * voorbeeldgegevens in het geheugen van de browser. Er gaat niets naar een database;
 * na herladen staat alles weer op de beginstand.
 *
 * Alleen actief op de demo-preview (zie DEMO_MODE in lib/supabase.ts). Nooit op productie.
 */
import { TREATMENT_CATEGORIES } from '@/lib/treatments';

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null; count?: number | null };

const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@belise.be',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Demo Belise' },
  created_at: new Date().toISOString(),
};
const DEMO_SESSION = {
  access_token: 'demo',
  refresh_token: 'demo',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: DEMO_USER,
};

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16),
  );
}

function dateKey(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isoAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

// ---------------------------------------------------------------- voorbeeldgegevens

function seedServices(): Row[] {
  const rows: Row[] = [];
  for (const category of TREATMENT_CATEGORIES) {
    category.treatments.forEach((item, index) => {
      const price = item.priceEuro;
      const active = item.activeDurationMin;
      const processing = item.processingDurationMin ?? 0;
      const perLength = typeof price === 'object' || typeof active === 'object';
      const pick = (value: unknown, key: 'short' | 'medium' | 'long') =>
        typeof value === 'object' && value !== null ? (value as Record<string, number>)[key] : value;
      rows.push({
        id: item.id,
        category_id: category.id,
        group_name: item.group ?? null,
        title: item.title,
        sort_order: index,
        is_active: true,
        price_euro: perLength ? null : price,
        active_duration_min: perLength ? null : active,
        processing_duration_min: typeof processing === 'number' ? processing : 0,
        length_pricing: perLength
          ? Object.fromEntries(
              (['short', 'medium', 'long'] as const).map((key) => [
                key,
                {
                  price_euro: pick(price, key),
                  active_duration_min: pick(active, key),
                  processing_duration_min: pick(processing, key) ?? 0,
                },
              ]),
            )
          : null,
      });
    });
  }
  return rows;
}

const CLIENTS = [
  ['Sofie Peeters', 'sofie.peeters@example.be', '0470 11 22 33', 'Geen', 'Amandel, medium, nude tinten'],
  ['Laura Janssens', 'laura.j@example.be', '0485 44 55 66', 'Latex', 'Kort, vierkant, rood'],
  ['Nina De Smet', 'nina.desmet@example.be', '0496 77 88 99', null, 'BIAB, naturel'],
  ['Elif Yilmaz', 'elif.y@example.be', '0472 10 20 30', null, null],
  ['Charlotte Maes', 'charlotte.maes@example.be', '0478 90 80 70', 'Gevoelige huid', 'Lang, stiletto, chroom'],
] as const;

function seedProfiles(): Row[] {
  const admin: Row = {
    id: DEMO_USER_ID,
    role: 'admin',
    full_name: 'Demo Belise',
    email: DEMO_USER.email,
    phone: null,
    allergies: null,
    allergy_consent_at: null,
    terms_accepted_at: isoAgo(24 * 30),
    hair_color_formula: null,
    nail_preferences: null,
    internal_notes: null,
    created_at: isoAgo(24 * 30),
  };
  return [
    admin,
    ...CLIENTS.map(([name, email, phone, allergies, nails], index) => ({
      id: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`,
      role: 'client',
      full_name: name,
      email,
      phone,
      allergies,
      allergy_consent_at: allergies ? isoAgo(24 * (10 + index)) : null,
      terms_accepted_at: isoAgo(24 * (20 + index)),
      hair_color_formula: index === 1 ? '7.1 + 6% oxidatie, 30 min' : null,
      nail_preferences: nails,
      internal_notes: index === 0 ? 'Vaste klant, komt elke 3 weken.' : null,
      created_at: isoAgo(24 * (20 + index)),
    })),
  ];
}

function line(id: string): Row {
  for (const category of TREATMENT_CATEGORIES) {
    const item = category.treatments.find((treatment) => treatment.id === id);
    if (item) {
      const price = typeof item.priceEuro === 'number' ? item.priceEuro : item.priceEuro.medium;
      return {
        id: item.id,
        title: item.title,
        price_euro: price,
        ...(typeof item.priceEuro === 'number' ? {} : { length: 'medium' }),
      };
    }
  }
  return { id, title: id, price_euro: 0 };
}

function firstIds(count: number): string[] {
  return TREATMENT_CATEGORIES.flatMap((category) => category.treatments.map((t) => t.id)).slice(0, count);
}

function seedBookings(profiles: Row[]): Row[] {
  const clients = profiles.filter((profile) => profile.role === 'client');
  const ids = firstIds(40);
  const plan: [number, string, string, number[], string][] = [
    [0, '09:30', '11:00', [0], 'confirmed'],
    [0, '11:30', '12:30', [2], 'pending'],
    [0, '14:00', '15:30', [1], 'confirmed'],
    [1, '10:00', '11:15', [3], 'pending'],
    [2, '13:00', '14:30', [0, 6], 'confirmed'],
    [4, '09:00', '10:00', [2], 'pending'],
    [-1, '10:00', '11:30', [0], 'completed'],
    [-3, '15:00', '16:00', [2], 'no_show'],
  ];
  return plan.map(([offset, start, end, picks, status], index) => {
    const treatments = picks.map((pick) => line(ids[pick % ids.length]));
    const total = treatments.reduce((sum, item) => sum + Number(item.price_euro ?? 0), 0);
    return {
      id: uuid(),
      client_id: clients[index % clients.length].id,
      treatments,
      booking_date: dateKey(offset),
      start_time: `${start}:00`,
      end_time: `${end}:00`,
      total_price: total,
      status,
      reference_now_path: null,
      inspiration_path: null,
      photo_social_consent: index % 2 === 0,
      client_notes: index === 1 ? 'Graag iets subtiels voor een trouwfeest.' : null,
      nail_design: null,
      created_at: isoAgo(48 + index * 5),
    };
  });
}

function seedMessages(profiles: Row[]): Row[] {
  const clients = profiles.filter((profile) => profile.role === 'client');
  return [
    {
      id: uuid(),
      client_id: clients[2].id,
      subject: 'Afspraak verplaatsen',
      body: 'Hoi! Kan mijn afspraak van vrijdag een uurtje later? Mijn trein is vertraagd. Groetjes, Nina',
      status: 'new',
      created_at: isoAgo(2),
    },
    {
      id: uuid(),
      client_id: clients[3].id,
      subject: 'Cadeaubon',
      body: 'Verkopen jullie cadeaubonnen voor Kerstmis? Ik zou er graag één geven aan mijn zus.',
      status: 'read',
      created_at: isoAgo(26),
    },
    {
      id: uuid(),
      client_id: clients[0].id,
      subject: 'Bedankt!',
      body: 'Mijn nagels zijn prachtig, iedereen vraagt waar ik ze heb laten doen.',
      status: 'answered',
      created_at: isoAgo(72),
    },
  ];
}

function seedAvailability(): Row[] {
  return [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    id: uuid(),
    day_of_week: day,
    start_time: day === 6 ? '09:00:00' : '09:30:00',
    end_time: day === 6 ? '15:00:00' : '18:00:00',
    is_active: day !== 0 && day !== 1,
  }));
}

function seedOverrides(): Row[] {
  return [
    { id: uuid(), specific_date: dateKey(9), is_available: false, start_time: null, end_time: null, note: 'Opleiding' },
    { id: uuid(), specific_date: dateKey(12), is_available: true, start_time: '18:00:00', end_time: '21:00:00', note: 'Avondopening' },
  ];
}

function seedPortfolio(): Row[] {
  const nails = [
    '/assets/Hands/hand-licht.webp',
    '/assets/Hands/hand-warm.webp',
    '/assets/Hands/hand-goud.webp',
    '/assets/Hands/hand-donker.webp',
  ];
  return nails.map((path, index) => ({
    id: uuid(),
    category_id: 'nails',
    image_path: path,
    title: ['Nude amandel', 'Bordeaux chroom', 'Goud accent', 'French ombre'][index],
    tags: [['nude', 'amandel'], ['bordeaux', 'chroom'], ['goud'], ['french', 'ombre']][index],
    sort_order: index,
    is_published: index !== 3,
    has_transparency: false,
    created_at: isoAgo(24 * (index + 1)),
  }));
}

function seedSettings(): Row[] {
  const now = new Date().toISOString();
  return [
    { key: 'announcement_enabled', value: 'true', updated_at: now },
    { key: 'announcement_text', value: 'Demo-omgeving: voorbeeldgegevens, niets wordt opgeslagen.', updated_at: now },
  ];
}

function createStore(): Record<string, Row[]> {
  const profiles = seedProfiles();
  return {
    profiles,
    admin_profiles: profiles, // view: dezelfde rijen
    client_own_profile: profiles,
    bookings: seedBookings(profiles),
    messages: seedMessages(profiles),
    services: seedServices(),
    site_settings: seedSettings(),
    weekly_availability: seedAvailability(),
    date_overrides: seedOverrides(),
    portfolio_items: seedPortfolio(),
  };
}

const PRIMARY_KEY: Record<string, string> = { site_settings: 'key', weekly_availability: 'day_of_week' };

// ---------------------------------------------------------------- querybuilder

type Filter = (row: Row) => boolean;

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  return String(a).localeCompare(String(b), 'nl', { numeric: true });
}

class DemoQuery implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private max: number | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private onConflict: string | null = null;

  constructor(
    private readonly store: Record<string, Row[]>,
    private readonly table: string,
  ) {}

  select() {
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = 'insert';
    this.payload = values;
    return this;
  }
  update(values: Row) {
    this.op = 'update';
    this.payload = values;
    return this;
  }
  upsert(values: Row | Row[], options?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = values;
    this.onConflict = options?.onConflict ?? null;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }
  gt(column: string, value: unknown) {
    this.filters.push((row) => compare(row[column], value) > 0);
    return this;
  }
  gte(column: string, value: unknown) {
    this.filters.push((row) => compare(row[column], value) >= 0);
    return this;
  }
  lt(column: string, value: unknown) {
    this.filters.push((row) => compare(row[column], value) < 0);
    return this;
  }
  lte(column: string, value: unknown) {
    this.filters.push((row) => compare(row[column], value) <= 0);
    return this;
  }
  in(column: string, values: readonly unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }
  is(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  filter(column: string, operator: string, value: unknown) {
    const map: Record<string, (c: string, v: unknown) => this> = {
      eq: (c, v) => this.eq(c, v),
      neq: (c, v) => this.neq(c, v),
      gt: (c, v) => this.gt(c, v),
      gte: (c, v) => this.gte(c, v),
      lt: (c, v) => this.lt(c, v),
      lte: (c, v) => this.lte(c, v),
    };
    return map[operator]?.(column, value) ?? this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }
  limit(count: number) {
    this.max = count;
    return this;
  }
  range(from: number, to: number) {
    this.max = to - from + 1;
    return this;
  }
  single() {
    this.mode = 'single';
    return this;
  }
  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }
  abortSignal() {
    return this;
  }
  returns() {
    return this;
  }
  throwOnError() {
    return this;
  }

  private matches(row: Row) {
    return this.filters.every((filter) => filter(row));
  }

  private execute(): Result {
    const rows = (this.store[this.table] ??= []);
    let affected: Row[] = [];

    if (this.op === 'insert' || this.op === 'upsert') {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const key = this.onConflict ?? PRIMARY_KEY[this.table] ?? 'id';
      for (const value of values) {
        const existing = this.op === 'upsert' ? rows.find((row) => row[key] === value[key]) : undefined;
        if (existing) {
          Object.assign(existing, value);
          affected.push(existing);
        } else {
          const row: Row = { id: uuid(), created_at: new Date().toISOString(), ...value };
          if (this.table === 'portfolio_items') {
            row.tags ??= [];
            row.sort_order ??= 0;
            row.is_published ??= true;
            row.has_transparency ??= false;
          }
          rows.unshift(row);
          affected.push(row);
        }
      }
    } else if (this.op === 'update') {
      affected = rows.filter((row) => this.matches(row));
      affected.forEach((row) => Object.assign(row, this.payload));
    } else if (this.op === 'delete') {
      affected = rows.filter((row) => this.matches(row));
      this.store[this.table] = rows.filter((row) => !affected.includes(row));
      if (this.table === 'profiles') this.store.admin_profiles = this.store.profiles;
    } else {
      affected = rows.filter((row) => this.matches(row));
    }

    let result = affected.map((row) => ({ ...row }));
    for (const { column, ascending } of [...this.orders].reverse()) {
      result = result.slice().sort((a, b) => compare(a[column], b[column]) * (ascending ? 1 : -1));
    }
    if (this.max !== null) result = result.slice(0, this.max);

    if (this.mode === 'single') {
      return result.length === 1
        ? { data: result[0], error: null }
        : { data: null, error: { message: 'Geen of meerdere rijen (demo).' } };
    }
    if (this.mode === 'maybe') return { data: result[0] ?? null, error: null };
    return { data: result, error: null, count: result.length };
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return new Promise<Result>((resolve) => setTimeout(() => resolve(this.execute()), 120)).then(
      onfulfilled,
      onrejected,
    );
  }
}

// ---------------------------------------------------------------- client

function makeSlots(): { slot_time: string }[] {
  const slots: { slot_time: string }[] = [];
  for (let minutes = 9 * 60 + 30; minutes <= 16 * 60 + 30; minutes += 30) {
    if (Math.random() < 0.3) continue;
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    slots.push({ slot_time: `${h}:${m}:00` });
  }
  return slots;
}

let browserStore: Record<string, Row[]> | null = null;

export function createDemoClient() {
  const store = typeof window === 'undefined' ? createStore() : (browserStore ??= createStore());
  const ok = <T>(data: T) => Promise.resolve({ data, error: null });

  return {
    from: (table: string) => new DemoQuery(store, table),
    rpc: (name: string, args: Record<string, unknown> = {}) => {
      if (name === 'get_available_slots') return ok(makeSlots());
      if (name === 'is_admin') return ok(true);
      if (name === 'create_booking') {
        const row: Row = {
          id: args.p_booking_id ?? uuid(),
          client_id: DEMO_USER_ID,
          treatments: args.p_treatments,
          booking_date: args.p_booking_date,
          start_time: args.p_start_time,
          end_time: args.p_end_time,
          total_price: args.p_total_price,
          status: 'pending',
          reference_now_path: args.p_reference_now_path ?? null,
          inspiration_path: args.p_inspiration_path ?? null,
          photo_social_consent: Boolean(args.p_photo_social_consent),
          client_notes: args.p_client_notes ?? null,
          nail_design: args.p_nail_design ?? null,
          created_at: new Date().toISOString(),
        };
        store.bookings.unshift(row);
        return ok(row);
      }
      return ok(null);
    },
    auth: {
      getSession: () => ok({ session: DEMO_SESSION }),
      getUser: () => ok({ user: DEMO_USER }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => ok({ user: DEMO_USER, session: DEMO_SESSION }),
      signInWithOtp: () => ok({ user: null, session: null }),
      exchangeCodeForSession: () => ok({ user: DEMO_USER, session: DEMO_SESSION }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: uploadedUrls.get(path) ?? (path.startsWith('/') ? path : '/assets/Hands/hand-licht.webp') },
        }),
        createSignedUrl: (path: string) =>
          ok({ signedUrl: path.startsWith('/') ? path : '/assets/Hands/hand-warm.webp' }),
        createSignedUrls: (paths: string[]) =>
          ok(paths.map((path) => ({ path, signedUrl: path.startsWith('/') ? path : '/assets/Hands/hand-warm.webp', error: null }))),
        upload: (path: string, file: Blob) => {
          const url = typeof URL !== 'undefined' && file ? URL.createObjectURL(file) : path;
          uploadedUrls.set(path, url);
          return ok({ path });
        },
        remove: () => ok([]),
      }),
    },
  };
}

/** Geüploade demo-foto's blijven als blob-URL in het geheugen, zodat ze meteen zichtbaar zijn. */
export const uploadedUrls = new Map<string, string>();
