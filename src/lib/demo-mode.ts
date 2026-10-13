"use client";

// Demo mode is set in localStorage ONLY when the user explicitly clicks the
// "Try preview mode" button on the Configure Supabase notice. It exists
// purely to let users explore the dashboard UI without setting up Supabase.
// All data shown in demo mode is in-memory and never persisted.

import { DEMO_DEMO_FLAG_KEY, DEMO_PROFILE } from "./demo-data";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEMO_DEMO_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDemoMode(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) {
      window.localStorage.setItem(DEMO_DEMO_FLAG_KEY, "true");
    } else {
      window.localStorage.removeItem(DEMO_DEMO_FLAG_KEY);
    }
  } catch {
    // Ignore.
  }
}

// A fake Supabase-like user object used to make the auth context think a
// session exists when in demo mode. Never used when Supabase is configured.
export const DEMO_USER = {
  id: DEMO_PROFILE.user_id,
  email: DEMO_PROFILE.email ?? "demo@example.com",
  email_confirmed_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  user_metadata: {
    full_name: DEMO_PROFILE.full_name,
    business_name: DEMO_PROFILE.business_name,
  },
};
