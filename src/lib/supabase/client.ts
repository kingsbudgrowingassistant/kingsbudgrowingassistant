import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True when BOTH env vars are set to real (non-placeholder) values.
 * Used to decide whether to render a "preview mode" banner.
 */
export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your-project-ref") &&
  !supabaseAnonKey.includes("your-anon-public-key");

/**
 * Browser Supabase client.
 *
 * We always create a client even if env vars are missing — that way
 * the dev server stays alive and the UI can render a "Configure Supabase"
 * screen rather than crashing on import.
 */
export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "kings-bud-grow-assistant-auth",
    },
    realtime: {
      params: { eventsPerSecond: 5 },
    },
  }
);
