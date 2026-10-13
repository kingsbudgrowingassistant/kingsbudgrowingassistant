// ---------------------------------------------------------------------------
// Database type definitions matching the Supabase PostgreSQL schema.
// Mirrors the SQL in supabase/schema.sql.
// ---------------------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TablesInsert = {
  [tableName: string]: {
    Insert: Record<string, unknown>;
  };
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          business_name: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          business_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          business_name?: string | null;
          is_admin?: boolean;
        };
      };

      site_settings: {
        Row: {
          id: number;
          brand_name: string;
          brand_tagline: string;
          hero_headline: string;
          hero_subtext: string | null;
          primary_color: string;
          contact_email: string | null;
          announcement: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          brand_name?: string;
          brand_tagline?: string;
          hero_headline?: string;
          hero_subtext?: string | null;
          primary_color?: string;
          contact_email?: string | null;
          announcement?: string | null;
          updated_at?: string;
        };
        Update: Partial<{
          brand_name: string;
          brand_tagline: string;
          hero_headline: string;
          hero_subtext: string | null;
          primary_color: string;
          contact_email: string | null;
          announcement: string | null;
        }>;
      };

      site_assets: {
        Row: {
          id: string;
          uploaded_by: string | null;
          slot: string;
          storage_path: string;
          file_name: string | null;
          mime_type: string;
          size_bytes: number | null;
          caption: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          uploaded_by?: string | null;
          slot: string;
          storage_path: string;
          file_name?: string | null;
          mime_type?: string;
          size_bytes?: number | null;
          caption?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          caption: string | null;
          is_active: boolean;
        }>;
      };

      seasons: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          start_date: string;
          end_date: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          start_date: string;
          end_date?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          start_date: string;
          end_date: string | null;
          status: string;
        }>;
      };

      tents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          location: string | null;
          dimensions: string | null;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          location?: string | null;
          dimensions?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          location: string | null;
          dimensions: string | null;
          status: string;
          notes: string | null;
        }>;
      };

      strains: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          breeder: string | null;
          type: string | null;
          thc_percent: number | null;
          cbd_percent: number | null;
          flowering_weeks: number | null;
          expected_yield_grams: number | null;
          lineage: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          breeder?: string | null;
          type?: string | null;
          thc_percent?: number | null;
          cbd_percent?: number | null;
          flowering_weeks?: number | null;
          expected_yield_grams?: number | null;
          lineage?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          breeder: string | null;
          type: string | null;
          thc_percent: number | null;
          cbd_percent: number | null;
          flowering_weeks: number | null;
          expected_yield_grams: number | null;
          lineage: string | null;
          description: string | null;
        }>;
      };

      nutrient_logs: {
        Row: {
          id: string;
          user_id: string;
          tent_id: string | null;
          strain_id: string | null;
          season_id: string | null;
          logged_at: string;
          nutrient_mix: string | null;
          amount_ml: number | null;
          water_ph: number | null;
          water_ec: number | null;
          runoff_ph: number | null;
          runoff_ec: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tent_id?: string | null;
          strain_id?: string | null;
          season_id?: string | null;
          logged_at?: string;
          nutrient_mix?: string | null;
          amount_ml?: number | null;
          water_ph?: number | null;
          water_ec?: number | null;
          runoff_ph?: number | null;
          runoff_ec?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          tent_id: string | null;
          strain_id: string | null;
          season_id: string | null;
          logged_at: string;
          nutrient_mix: string | null;
          amount_ml: number | null;
          water_ph: number | null;
          water_ec: number | null;
          runoff_ph: number | null;
          runoff_ec: number | null;
          notes: string | null;
        }>;
      };

      environment_logs: {
        Row: {
          id: string;
          user_id: string;
          tent_id: string | null;
          logged_at: string;
          temp_c: number;
          humidity_pct: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tent_id?: string | null;
          logged_at?: string;
          temp_c: number;
          humidity_pct: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          tent_id: string | null;
          logged_at: string;
          temp_c: number;
          humidity_pct: number;
          notes: string | null;
        }>;
      };

      lights: {
        Row: {
          id: string;
          user_id: string;
          tent_id: string;
          name: string;
          wattage: number;
          quantity: number;
          hours_per_day: number;
          active: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tent_id: string;
          name: string;
          wattage: number;
          quantity?: number;
          hours_per_day?: number;
          active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          tent_id: string;
          name: string;
          wattage: number;
          quantity: number;
          hours_per_day: number;
          active: boolean;
          start_date: string | null;
          end_date: string | null;
        }>;
      };

      electricity: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          tariff: number;
          fixed_charge: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          tariff: number;
          fixed_charge?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          month: string;
          tariff: number;
          fixed_charge: number;
          notes: string | null;
        }>;
      };

      expenses: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          description: string | null;
          amount: number;
          date: string;
          tent_id: string | null;
          season_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          description?: string | null;
          amount: number;
          date: string;
          tent_id?: string | null;
          season_id?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          category: string;
          description: string | null;
          amount: number;
          date: string;
          tent_id: string | null;
          season_id: string | null;
        }>;
      };

      harvests: {
        Row: {
          id: string;
          user_id: string;
          tent_id: string | null;
          strain_id: string | null;
          cycle_name: string;
          start_date: string | null;
          harvest_date: string | null;
          wet_weight: number;
          dry_weight: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tent_id?: string | null;
          strain_id?: string | null;
          cycle_name: string;
          start_date?: string | null;
          harvest_date?: string | null;
          wet_weight?: number;
          dry_weight?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          tent_id: string | null;
          strain_id: string | null;
          cycle_name: string;
          start_date: string | null;
          harvest_date: string | null;
          wet_weight: number;
          dry_weight: number;
          notes: string | null;
        }>;
      };

      harvest_photos: {
        Row: {
          id: string;
          user_id: string;
          harvest_id: string;
          storage_path: string;
          file_name: string | null;
          mime_type: string;
          size_bytes: number | null;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          harvest_id: string;
          storage_path: string;
          file_name?: string | null;
          mime_type?: string;
          size_bytes?: number | null;
          caption?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          caption: string | null;
        }>;
      };

      sales: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          product: string;
          quantity: number;
          price_per_gram: number;
          revenue: number;
          season_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          product: string;
          quantity: number;
          price_per_gram: number;
          revenue?: number;
          season_id?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          date: string;
          product: string;
          quantity: number;
          price_per_gram: number;
          revenue: number;
          season_id: string | null;
        }>;
      };

      settings: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          electricity_tariff: number;
          company_percentage: number;
          director_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency?: string;
          electricity_tariff?: number;
          company_percentage?: number;
          director_count?: number;
          created_at?: string;
        };
        Update: Partial<{
          currency: string;
          electricity_tariff: number;
          company_percentage: number;
          director_count: number;
        }>;
      };

      directors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          percentage: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          percentage?: number;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          percentage: number;
        }>;
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
export type SiteAsset = Database["public"]["Tables"]["site_assets"]["Row"];
export type Season = Database["public"]["Tables"]["seasons"]["Row"];
export type Tent = Database["public"]["Tables"]["tents"]["Row"];
export type Strain = Database["public"]["Tables"]["strains"]["Row"];
export type NutrientLog = Database["public"]["Tables"]["nutrient_logs"]["Row"];
export type EnvironmentLog = Database["public"]["Tables"]["environment_logs"]["Row"];
export type Light = Database["public"]["Tables"]["lights"]["Row"];
export type Electricity = Database["public"]["Tables"]["electricity"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Harvest = Database["public"]["Tables"]["harvests"]["Row"];
export type HarvestPhoto = Database["public"]["Tables"]["harvest_photos"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type Director = Database["public"]["Tables"]["directors"]["Row"];
