export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = 'client' | 'admin';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type ProfileRow = {
  id: string;
  role: ProfileRole;
  full_name: string;
  email: string;
  phone: string | null;
  allergies: string | null;
  allergy_consent_at: string | null;
  terms_accepted_at: string;
  hair_color_formula: string | null;
  nail_preferences: string | null;
  internal_notes: string | null;
  /** Aantal keer niet komen opdagen zonder verwittigen. */
  no_show_count: number;
  /** Toestemming om foto's van het resultaat te delen (portfolio, Instagram). */
  photo_consent: boolean;
  photo_consent_at: string | null;
  created_at: string;
};

/** Wat de klant-UI ziet: geen interne salonvelden. */
export type ClientOwnProfileRow = Omit<
  ProfileRow,
  'hair_color_formula' | 'nail_preferences' | 'internal_notes' | 'no_show_count' | 'photo_consent' | 'photo_consent_at'
>;

export type AdminProfileRow = ProfileRow;

export type BookingRow = {
  id: string;
  client_id: string | null;
  treatments: Json;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: BookingStatus;
  reference_now_path: string | null;
  inspiration_path: string | null;
  photo_social_consent: boolean;
  client_notes: string | null;
  /** Ontwerp uit /designer, gevalideerd in de database. */
  nail_design: Json | null;
  created_at: string;
};

type ProfileRequired = 'id' | 'full_name' | 'email' | 'terms_accepted_at';
type BookingRequired = 'treatments' | 'booking_date' | 'start_time' | 'end_time' | 'total_price';

export type WeeklyAvailabilityRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type DateOverrideRow = {
  id: string;
  specific_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
};

export type ServiceRow = {
  id: string;
  category_id: 'nails' | 'waxing' | 'hair' | 'massage';
  group_name: string | null;
  title: string;
  sort_order: number;
  is_active: boolean;
  price_euro: number | null;
  active_duration_min: number | null;
  processing_duration_min: number;
  length_pricing: Json | null;
};

export type SiteSettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

export type PortfolioCategoryId = 'nails' | 'waxing' | 'hair' | 'massage';

export type PortfolioItemRow = {
  id: string;
  category_id: PortfolioCategoryId;
  image_path: string;
  title: string | null;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  /** Uitgeknipte foto met doorzichtige achtergrond (PNG). Wordt zonder bijsnijden getoond. */
  has_transparency: boolean;
  /** Klant op de foto, uit het klantenbestand. */
  client_id: string | null;
  created_at: string;
};

export type MessageStatus = 'new' | 'read' | 'answered';

export type MessageRow = {
  id: string;
  client_id: string;
  subject: string;
  body: string;
  status: MessageStatus;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      weekly_availability: {
        Row: WeeklyAvailabilityRow;
        Insert: Pick<WeeklyAvailabilityRow, 'day_of_week'> & Partial<WeeklyAvailabilityRow>;
        Update: Partial<WeeklyAvailabilityRow>;
        Relationships: [];
      };
      date_overrides: {
        Row: DateOverrideRow;
        Insert: Pick<DateOverrideRow, 'specific_date' | 'is_available'> & Partial<DateOverrideRow>;
        Update: Partial<DateOverrideRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, ProfileRequired> & Partial<Omit<ProfileRow, ProfileRequired>>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      services: {
        Row: ServiceRow;
        Insert: Pick<ServiceRow, 'id' | 'category_id' | 'title'> & Partial<ServiceRow>;
        Update: Partial<ServiceRow>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettingRow;
        Insert: Pick<SiteSettingRow, 'key'> & Partial<SiteSettingRow>;
        Update: Partial<SiteSettingRow>;
        Relationships: [];
      };
      portfolio_items: {
        Row: PortfolioItemRow;
        Insert: Pick<PortfolioItemRow, 'category_id' | 'image_path'> & Partial<PortfolioItemRow>;
        Update: Partial<PortfolioItemRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Pick<MessageRow, 'subject' | 'body'>;
        Update: Pick<MessageRow, 'status'>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRow;
        Insert: Pick<BookingRow, BookingRequired> & Partial<Omit<BookingRow, BookingRequired>>;
        Update: Partial<BookingRow>;
        Relationships: [];
      };
    };
    Views: {
      client_own_profile: {
        Row: ClientOwnProfileRow;
        Relationships: [];
      };
      admin_profiles: {
        Row: AdminProfileRow;
        Relationships: [];
      };
    };
    Functions: {
      get_available_slots: {
        Args: { p_date: string; p_duration_min: number };
        Returns: { slot_time: string }[];
      };
      create_booking: {
        Args: {
          p_booking_id: string;
          p_booking_date: string;
          p_start_time: string;
          p_end_time: string;
          p_treatments: Json;
          p_total_price: number;
          p_client_notes: string | null;
          p_reference_now_path: string | null;
          p_inspiration_path: string | null;
          p_photo_social_consent: boolean;
          p_nail_design?: Json | null;
        };
        Returns: BookingRow;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_delete_client: {
        Args: { p_client_id: string };
        Returns: undefined;
      };
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};