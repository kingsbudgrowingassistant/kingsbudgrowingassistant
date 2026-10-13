"use client";

// SiteContext — loads site_settings + active site_assets before any auth-
// gated content renders. The landing page uses this to render the brand
// name, logo, hero image, and announcement banner — even when no user is
// logged in. Only the admin can change these (via the Admin Panel).
//
// Realtime subscriptions mean any change the admin makes propagates to
// every open tab within ~1 second.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "./supabase/client";
import type { SiteAsset, SiteSettings } from "./supabase/types";

interface SiteContextValue {
  settings: SiteSettings | null;
  assets: SiteAsset[];
  // Look up the active asset for a given slot (e.g. "logo").
  assetForSlot: (slot: string) => SiteAsset | null;
  // Get the public URL for a stored asset.
  assetUrl: (asset: SiteAsset | null) => string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  brand_name: "Kings Bud",
  brand_tagline: "Grow Assistant",
  hero_headline:
    "Grow smarter. Track every gram, watt, and rand from any device.",
  hero_subtext:
    "Cloud-based cultivation business assistant with secure multi-user authentication, multi-device sync, and break-even tracking — backed by Supabase and protected by Row Level Security.",
  primary_color: "#16a34a",
  contact_email: null,
  announcement: null,
  updated_at: new Date().toISOString(),
};

const SiteContext = createContext<SiteContextValue>({
  settings: null,
  assets: [],
  assetForSlot: () => null,
  assetUrl: () => null,
  loading: true,
  refresh: async () => {},
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Use defaults so the landing page renders with placeholder branding
      // in demo/preview mode.
      setSettings(DEFAULT_SETTINGS);
      setAssets([]);
      setLoading(false);
      return;
    }
    try {
      const [settingsRes, assetsRes] = await Promise.all([
        supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
        supabase
          .from("site_assets")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      if (settingsRes.data) setSettings(settingsRes.data as SiteSettings);
      else setSettings(DEFAULT_SETTINGS);
      setAssets((assetsRes.data as SiteAsset[]) ?? []);
    } catch (err) {
      console.warn("[site] fetch error:", err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    if (!isSupabaseConfigured) return;

    // Realtime: admin updates site_settings or uploads a new asset → every
    // client refetches immediately.
    const settingsChannel = supabase
      .channel("realtime-site-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => {
          supabase
            .from("site_settings")
            .select("*")
            .eq("id", 1)
            .maybeSingle()
            .then(({ data }) => {
              if (data) setSettings(data as SiteSettings);
            });
        }
      )
      .subscribe();

    const assetsChannel = supabase
      .channel("realtime-site-assets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_assets" },
        () => {
          supabase
            .from("site_assets")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) setAssets(data as SiteAsset[]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(assetsChannel);
    };
  }, [fetchAll]);

  const assetForSlot = useCallback(
    (slot: string): SiteAsset | null => {
      // Return the most recently created active asset for the slot.
      return (
        assets
          .filter((a) => a.slot === slot && a.is_active)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null
      );
    },
    [assets]
  );

  const assetUrl = useCallback((asset: SiteAsset | null): string | null => {
    if (!asset) return null;
    // site-assets bucket is public — return the public URL directly.
    const { data } = supabase.storage
      .from("site-assets")
      .getPublicUrl(asset.storage_path);
    return data?.publicUrl ?? null;
  }, []);

  const value = useMemo<SiteContextValue>(
    () => ({
      settings,
      assets,
      assetForSlot,
      assetUrl,
      loading,
      refresh: fetchAll,
    }),
    [settings, assets, assetForSlot, assetUrl, loading, fetchAll]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
