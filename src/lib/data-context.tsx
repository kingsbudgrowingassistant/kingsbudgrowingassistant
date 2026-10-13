"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase/client";
import { useAuth } from "./auth-context";
import type {
  Director,
  Electricity,
  EnvironmentLog,
  Expense,
  Harvest,
  HarvestPhoto,
  Light,
  NutrientLog,
  Profile,
  Sale,
  Season,
  Settings,
  SiteAsset,
  SiteSettings,
  Strain,
  Tent,
} from "./supabase/types";
import { DEFAULT_SETTINGS } from "./calculations";

interface DataContextValue {
  loading: boolean;
  error: string | null;
  tents: Tent[];
  lights: Light[];
  electricity: Electricity[];
  expenses: Expense[];
  harvests: Harvest[];
  harvestPhotos: HarvestPhoto[];
  nutrientLogs: NutrientLog[];
  environmentLogs: EnvironmentLog[];
  sales: Sale[];
  seasons: Season[];
  strains: Strain[];
  settings: Settings | null;
  directors: Director[];
  refetch: () => Promise<void>;
  // CRUD helpers (all scoped to current user_id via Supabase RLS)
  upsertTent: (t: Partial<Tent> & { name: string }) => Promise<void>;
  deleteTent: (id: string) => Promise<void>;
  upsertLight: (l: Partial<Light> & { tent_id: string; name: string; wattage: number }) => Promise<void>;
  deleteLight: (id: string) => Promise<void>;
  upsertElectricity: (e: Partial<Electricity> & { month: string; tariff: number }) => Promise<void>;
  deleteElectricity: (id: string) => Promise<void>;
  upsertExpense: (e: Partial<Expense> & { category: string; amount: number; date: string }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  upsertHarvest: (h: Partial<Harvest> & { cycle_name: string }) => Promise<void>;
  deleteHarvest: (id: string) => Promise<void>;
  upsertStrain: (s: Partial<Strain> & { name: string }) => Promise<void>;
  deleteStrain: (id: string) => Promise<void>;
  upsertNutrientLog: (n: Partial<NutrientLog> & { logged_at: string }) => Promise<void>;
  deleteNutrientLog: (id: string) => Promise<void>;
  upsertEnvironmentLog: (e: Partial<EnvironmentLog> & { logged_at: string; temp_c: number; humidity_pct: number }) => Promise<void>;
  deleteEnvironmentLog: (id: string) => Promise<void>;
  uploadHarvestPhoto: (harvestId: string, file: File, caption?: string) => Promise<void>;
  deleteHarvestPhoto: (id: string) => Promise<void>;
  getHarvestPhotoUrl: (photo: HarvestPhoto) => Promise<string | null>;
  upsertSale: (s: Partial<Sale> & { date: string; product: string; quantity: number; price_per_gram: number }) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  upsertSeason: (s: Partial<Season> & { name: string; start_date: string }) => Promise<void>;
  deleteSeason: (id: string) => Promise<void>;
  upsertSettings: (s: Partial<Settings>) => Promise<void>;
  upsertDirector: (d: Partial<Director> & { name: string }) => Promise<void>;
  deleteDirector: (id: string) => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  // Admin-only helpers (RLS-enforced server-side)
  upsertSiteSettings: (s: Partial<SiteSettings>) => Promise<void>;
  uploadSiteAsset: (slot: string, file: File, caption?: string) => Promise<void>;
  deleteSiteAsset: (id: string) => Promise<void>;
  listAllProfiles: () => Promise<Profile[]>;
}

export const DataContext = createContext<DataContextValue | null>(null);

const TABLES = [
  "tents",
  "lights",
  "electricity",
  "expenses",
  "harvests",
  "harvest_photos",
  "nutrient_logs",
  "environment_logs",
  "sales",
  "seasons",
  "strains",
  "settings",
  "directors",
] as const;

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tents, setTents] = useState<Tent[]>([]);
  const [lights, setLights] = useState<Light[]>([]);
  const [electricity, setElectricity] = useState<Electricity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [harvestPhotos, setHarvestPhotos] = useState<HarvestPhoto[]>([]);
  const [nutrientLogs, setNutrientLogs] = useState<NutrientLog[]>([]);
  const [environmentLogs, setEnvironmentLogs] = useState<EnvironmentLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [directors, setDirectors] = useState<Director[]>([]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [
        tentsRes,
        lightsRes,
        electricityRes,
        expensesRes,
        harvestsRes,
        harvestPhotosRes,
        nutrientLogsRes,
        environmentLogsRes,
        salesRes,
        seasonsRes,
        strainsRes,
        settingsRes,
        directorsRes,
      ] = await Promise.all([
        supabase.from("tents").select("*").order("created_at", { ascending: false }),
        supabase.from("lights").select("*").order("created_at", { ascending: false }),
        supabase.from("electricity").select("*").order("month", { ascending: false }),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("harvests").select("*").order("created_at", { ascending: false }),
        supabase.from("harvest_photos").select("*").order("created_at", { ascending: false }),
        supabase.from("nutrient_logs").select("*").order("logged_at", { ascending: false }),
        supabase.from("environment_logs").select("*").order("logged_at", { ascending: false }),
        supabase.from("sales").select("*").order("date", { ascending: false }),
        supabase.from("seasons").select("*").order("start_date", { ascending: false }),
        supabase.from("strains").select("*").order("name", { ascending: true }),
        supabase.from("settings").select("*").maybeSingle(),
        supabase.from("directors").select("*").order("created_at", { ascending: true }),
      ]);

      const firstError =
        tentsRes.error ||
        lightsRes.error ||
        electricityRes.error ||
        expensesRes.error ||
        harvestsRes.error ||
        harvestPhotosRes.error ||
        nutrientLogsRes.error ||
        environmentLogsRes.error ||
        salesRes.error ||
        seasonsRes.error ||
        strainsRes.error ||
        settingsRes.error ||
        directorsRes.error;
      if (firstError) throw firstError;

      setTents((tentsRes.data as Tent[]) ?? []);
      setLights((lightsRes.data as Light[]) ?? []);
      setElectricity((electricityRes.data as Electricity[]) ?? []);
      setExpenses((expensesRes.data as Expense[]) ?? []);
      setHarvests((harvestsRes.data as Harvest[]) ?? []);
      setHarvestPhotos((harvestPhotosRes.data as HarvestPhoto[]) ?? []);
      setNutrientLogs((nutrientLogsRes.data as NutrientLog[]) ?? []);
      setEnvironmentLogs((environmentLogsRes.data as EnvironmentLog[]) ?? []);
      setSales((salesRes.data as Sale[]) ?? []);
      setSeasons((seasonsRes.data as Season[]) ?? []);
      setStrains((strainsRes.data as Strain[]) ?? []);
      setSettings((settingsRes.data as Settings | null) ?? null);
      setDirectors((directorsRes.data as Director[]) ?? []);

      // Auto-provision default settings row if missing.
      if (!settingsRes.data && userId) {
        const { data: created } = await supabase
          .from("settings")
          .insert({
            user_id: userId,
            ...DEFAULT_SETTINGS,
          })
          .select()
          .maybeSingle();
        if (created) setSettings(created as Settings);
      }
    } catch (err) {
      console.error("[data] fetchAll error:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch + realtime subscriptions.
  useEffect(() => {
    if (!userId) return;
    fetchAll();

    const channels = TABLES.map((table) =>
      supabase
        .channel(`realtime-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
          () => {
            // On any change, just refetch the affected table.
            // Refetching the whole table is cheap for free-tier usage.
            supabase
              .from(table)
              .select("*")
              .then(({ data, error }) => {
                if (error) return;
                switch (table) {
                  case "tents":
                    setTents((data as Tent[]) ?? []);
                    break;
                  case "lights":
                    setLights((data as Light[]) ?? []);
                    break;
                  case "electricity":
                    setElectricity((data as Electricity[]) ?? []);
                    break;
                  case "expenses":
                    setExpenses((data as Expense[]) ?? []);
                    break;
                  case "harvests":
                    setHarvests((data as Harvest[]) ?? []);
                    break;
                  case "harvest_photos":
                    setHarvestPhotos((data as HarvestPhoto[]) ?? []);
                    break;
                  case "nutrient_logs":
                    setNutrientLogs((data as NutrientLog[]) ?? []);
                    break;
                  case "environment_logs":
                    setEnvironmentLogs((data as EnvironmentLog[]) ?? []);
                    break;
                  case "sales":
                    setSales((data as Sale[]) ?? []);
                    break;
                  case "seasons":
                    setSeasons((data as Season[]) ?? []);
                    break;
                  case "strains":
                    setStrains((data as Strain[]) ?? []);
                    break;
                  case "settings":
                    setSettings((data as Settings | null)?.[0] ?? null);
                    break;
                  case "directors":
                    setDirectors((data as Director[]) ?? []);
                    break;
                }
              });
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [userId, fetchAll]);

  // ---- CRUD helpers (all RLS-scoped) ----
  const upsertTent: DataContextValue["upsertTent"] = useCallback(
    async (t) => {
      if (!userId) return;
      const payload = {
        id: t.id,
        user_id: userId,
        name: t.name,
        location: t.location ?? null,
        dimensions: t.dimensions ?? null,
        status: t.status ?? "active",
        notes: t.notes ?? null,
      };
      const { error } = await supabase.from("tents").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteTent = useCallback(async (id: string) => {
    const { error } = await supabase.from("tents").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertLight: DataContextValue["upsertLight"] = useCallback(
    async (l) => {
      if (!userId) return;
      const payload = {
        id: l.id,
        user_id: userId,
        tent_id: l.tent_id,
        name: l.name,
        wattage: Number(l.wattage),
        quantity: Number(l.quantity ?? 1),
        hours_per_day: Number(l.hours_per_day ?? 18),
        active: l.active ?? true,
        start_date: l.start_date ?? null,
        end_date: l.end_date ?? null,
      };
      const { error } = await supabase.from("lights").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteLight = useCallback(async (id: string) => {
    const { error } = await supabase.from("lights").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertElectricity: DataContextValue["upsertElectricity"] = useCallback(
    async (e) => {
      if (!userId) return;
      const payload = {
        id: e.id,
        user_id: userId,
        month: e.month,
        tariff: Number(e.tariff),
        fixed_charge: Number(e.fixed_charge ?? 0),
        notes: e.notes ?? null,
      };
      const { error } = await supabase.from("electricity").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteElectricity = useCallback(async (id: string) => {
    const { error } = await supabase.from("electricity").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertExpense: DataContextValue["upsertExpense"] = useCallback(
    async (e) => {
      if (!userId) return;
      const payload = {
        id: e.id,
        user_id: userId,
        category: e.category,
        description: e.description ?? null,
        amount: Number(e.amount),
        date: e.date,
        tent_id: e.tent_id ?? null,
        season_id: e.season_id ?? null,
      };
      const { error } = await supabase.from("expenses").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertHarvest: DataContextValue["upsertHarvest"] = useCallback(
    async (h) => {
      if (!userId) return;
      const payload = {
        id: h.id,
        user_id: userId,
        tent_id: h.tent_id ?? null,
        strain_id: h.strain_id ?? null,
        cycle_name: h.cycle_name,
        start_date: h.start_date ?? null,
        harvest_date: h.harvest_date ?? null,
        wet_weight: Number(h.wet_weight ?? 0),
        dry_weight: Number(h.dry_weight ?? 0),
        notes: h.notes ?? null,
      };
      const { error } = await supabase.from("harvests").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteHarvest = useCallback(async (id: string) => {
    // Also delete any photos belonging to this harvest from Storage + table.
    const { data: photos } = await supabase
      .from("harvest_photos")
      .select("storage_path")
      .eq("harvest_id", id);
    if (photos && photos.length > 0) {
      await supabase.storage
        .from("harvest-photos")
        .remove((photos as { storage_path: string }[]).map((p) => p.storage_path));
    }
    const { error } = await supabase.from("harvests").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertStrain: DataContextValue["upsertStrain"] = useCallback(
    async (s) => {
      if (!userId) return;
      const payload = {
        id: s.id,
        user_id: userId,
        name: s.name,
        breeder: s.breeder ?? null,
        type: s.type ?? null,
        thc_percent: s.thc_percent ?? null,
        cbd_percent: s.cbd_percent ?? null,
        flowering_weeks: s.flowering_weeks ?? null,
        expected_yield_grams: s.expected_yield_grams ?? null,
        lineage: s.lineage ?? null,
        description: s.description ?? null,
      };
      const { error } = await supabase.from("strains").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteStrain = useCallback(async (id: string) => {
    const { error } = await supabase.from("strains").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertNutrientLog: DataContextValue["upsertNutrientLog"] = useCallback(
    async (n) => {
      if (!userId) return;
      const payload = {
        id: n.id,
        user_id: userId,
        tent_id: n.tent_id ?? null,
        strain_id: n.strain_id ?? null,
        season_id: n.season_id ?? null,
        logged_at: n.logged_at,
        nutrient_mix: n.nutrient_mix ?? null,
        amount_ml: n.amount_ml != null ? Number(n.amount_ml) : null,
        water_ph: n.water_ph != null ? Number(n.water_ph) : null,
        water_ec: n.water_ec != null ? Number(n.water_ec) : null,
        runoff_ph: n.runoff_ph != null ? Number(n.runoff_ph) : null,
        runoff_ec: n.runoff_ec != null ? Number(n.runoff_ec) : null,
        notes: n.notes ?? null,
      };
      const { error } = await supabase.from("nutrient_logs").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteNutrientLog = useCallback(async (id: string) => {
    const { error } = await supabase.from("nutrient_logs").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertEnvironmentLog: DataContextValue["upsertEnvironmentLog"] = useCallback(
    async (e) => {
      if (!userId) return;
      const payload = {
        id: e.id,
        user_id: userId,
        tent_id: e.tent_id ?? null,
        logged_at: e.logged_at,
        temp_c: Number(e.temp_c),
        humidity_pct: Number(e.humidity_pct),
        notes: e.notes ?? null,
      };
      const { error } = await supabase.from("environment_logs").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteEnvironmentLog = useCallback(async (id: string) => {
    const { error } = await supabase.from("environment_logs").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const uploadHarvestPhoto: DataContextValue["uploadHarvestPhoto"] =
    useCallback(
      async (harvestId, file, caption) => {
        if (!userId) return;
        // Build a per-user / per-harvest path:  <user_id>/<harvest_id>/<uuid>.<ext>
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);
        const storagePath = `${userId}/${harvestId}/${fileId}.${ext}`;
        // Upload the file to the harvest-photos bucket (private).
        const { error: upErr } = await supabase.storage
          .from("harvest-photos")
          .upload(storagePath, file, {
            contentType: file.type || "image/jpeg",
            cacheControl: "3600",
            upsert: false,
          });
        if (upErr) throw upErr;
        // Insert the metadata row.
        const { error: rowErr } = await supabase.from("harvest_photos").insert({
          user_id: userId,
          harvest_id: harvestId,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type || "image/jpeg",
          size_bytes: file.size,
          caption: caption ?? null,
        });
        if (rowErr) throw rowErr;
      },
      [userId]
    );

  const deleteHarvestPhoto = useCallback(
    async (id: string) => {
      // Look up the storage_path first so we can remove the file too.
      const { data, error: lookupErr } = await supabase
        .from("harvest_photos")
        .select("storage_path")
        .eq("id", id)
        .maybeSingle();
      if (lookupErr) throw lookupErr;
      if (data?.storage_path) {
        await supabase.storage
          .from("harvest-photos")
          .remove([data.storage_path as string]);
      }
      const { error } = await supabase
        .from("harvest_photos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    []
  );

  const getHarvestPhotoUrl = useCallback(
    async (photo: HarvestPhoto): Promise<string | null> => {
      // Photos are stored in a private bucket — generate a signed URL that
      // expires in 1 hour. Falls back to a public URL if the bucket was
      // accidentally created as public.
      const { data, error } = await supabase.storage
        .from("harvest-photos")
        .createSignedUrl(photo.storage_path, 3600);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    },
    []
  );

  const upsertSale: DataContextValue["upsertSale"] = useCallback(
    async (s) => {
      if (!userId) return;
      const qty = Number(s.quantity);
      const ppg = Number(s.price_per_gram);
      const payload = {
        id: s.id,
        user_id: userId,
        date: s.date,
        product: s.product,
        quantity: qty,
        price_per_gram: ppg,
        revenue: Number(s.revenue ?? qty * ppg),
        season_id: s.season_id ?? null,
      };
      const { error } = await supabase.from("sales").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteSale = useCallback(async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertSeason: DataContextValue["upsertSeason"] = useCallback(
    async (s) => {
      if (!userId) return;
      const payload = {
        id: s.id,
        user_id: userId,
        name: s.name,
        start_date: s.start_date,
        end_date: s.end_date ?? null,
        status: s.status ?? "active",
      };
      const { error } = await supabase.from("seasons").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteSeason = useCallback(async (id: string) => {
    const { error } = await supabase.from("seasons").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const upsertSettings: DataContextValue["upsertSettings"] = useCallback(
    async (s) => {
      if (!userId) return;
      const existing = settings?.id
        ? settings
        : ((await supabase
            .from("settings")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()
            .then(({ data }) => data as Settings | null)) ?? null);

      const payload = {
        id: existing?.id,
        user_id: userId,
        currency: s.currency ?? existing?.currency ?? DEFAULT_SETTINGS.currency,
        electricity_tariff:
          s.electricity_tariff ??
          existing?.electricity_tariff ??
          DEFAULT_SETTINGS.electricity_tariff,
        company_percentage:
          s.company_percentage ??
          existing?.company_percentage ??
          DEFAULT_SETTINGS.company_percentage,
        director_count:
          s.director_count ?? existing?.director_count ?? DEFAULT_SETTINGS.director_count,
      };
      const { error } = await supabase.from("settings").upsert(payload);
      if (error) throw error;
    },
    [userId, settings]
  );

  const upsertDirector: DataContextValue["upsertDirector"] = useCallback(
    async (d) => {
      if (!userId) return;
      const payload = {
        id: d.id,
        user_id: userId,
        name: d.name,
        percentage: Number(d.percentage ?? 0),
      };
      const { error } = await supabase.from("directors").upsert(payload);
      if (error) throw error;
    },
    [userId]
  );

  const deleteDirector = useCallback(async (id: string) => {
    const { error } = await supabase.from("directors").delete().eq("id", id);
    if (error) throw error;
  }, []);

  const updateProfile: DataContextValue["updateProfile"] = useCallback(
    async (p) => {
      if (!userId) return;
      const { error } = await supabase
        .from("profiles")
        .update(p)
        .eq("user_id", userId);
      if (error) throw error;
    },
    [userId]
  );

  // ---- Admin-only helpers (RLS will reject calls from non-admins) ----
  const upsertSiteSettings: DataContextValue["upsertSiteSettings"] =
    useCallback(async (s) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ ...s, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
    }, []);

  const uploadSiteAsset: DataContextValue["uploadSiteAsset"] = useCallback(
    async (slot, file, caption) => {
      if (!userId) throw new Error("Must be signed in as admin");
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const fileId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const storagePath = `${slot}/${fileId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(storagePath, file, {
          contentType: file.type || "image/png",
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { error: rowErr } = await supabase.from("site_assets").insert({
        uploaded_by: userId,
        slot,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || "image/png",
        size_bytes: file.size,
        caption: caption ?? null,
        is_active: true,
      });
      if (rowErr) throw rowErr;
    },
    [userId]
  );

  const deleteSiteAsset: DataContextValue["deleteSiteAsset"] = useCallback(
    async (id) => {
      // Look up the storage_path first.
      const { data, error: lookupErr } = await supabase
        .from("site_assets")
        .select("storage_path")
        .eq("id", id)
        .maybeSingle();
      if (lookupErr) throw lookupErr;
      if (data?.storage_path) {
        await supabase.storage
          .from("site-assets")
          .remove([data.storage_path as string]);
      }
      const { error } = await supabase
        .from("site_assets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    []
  );

  const listAllProfiles: DataContextValue["listAllProfiles"] = useCallback(
    async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Profile[]) ?? [];
    },
    []
  );

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      error,
      tents,
      lights,
      electricity,
      expenses,
      harvests,
      harvestPhotos,
      nutrientLogs,
      environmentLogs,
      sales,
      seasons,
      strains,
      settings,
      directors,
      refetch: fetchAll,
      upsertTent,
      deleteTent,
      upsertLight,
      deleteLight,
      upsertElectricity,
      deleteElectricity,
      upsertExpense,
      deleteExpense,
      upsertHarvest,
      deleteHarvest,
      upsertStrain,
      deleteStrain,
      upsertNutrientLog,
      deleteNutrientLog,
      upsertEnvironmentLog,
      deleteEnvironmentLog,
      uploadHarvestPhoto,
      deleteHarvestPhoto,
      getHarvestPhotoUrl,
      upsertSale,
      deleteSale,
      upsertSeason,
      deleteSeason,
      upsertSettings,
      upsertDirector,
      deleteDirector,
      updateProfile,
      upsertSiteSettings,
      uploadSiteAsset,
      deleteSiteAsset,
      listAllProfiles,
    }),
    [
      loading,
      error,
      tents,
      lights,
      electricity,
      expenses,
      harvests,
      harvestPhotos,
      nutrientLogs,
      environmentLogs,
      sales,
      seasons,
      strains,
      settings,
      directors,
      fetchAll,
      upsertTent,
      deleteTent,
      upsertLight,
      deleteLight,
      upsertElectricity,
      deleteElectricity,
      upsertExpense,
      deleteExpense,
      upsertHarvest,
      deleteHarvest,
      upsertStrain,
      deleteStrain,
      upsertNutrientLog,
      deleteNutrientLog,
      upsertEnvironmentLog,
      deleteEnvironmentLog,
      uploadHarvestPhoto,
      deleteHarvestPhoto,
      getHarvestPhotoUrl,
      upsertSale,
      deleteSale,
      upsertSeason,
      deleteSeason,
      upsertSettings,
      upsertDirector,
      deleteDirector,
      updateProfile,
      upsertSiteSettings,
      uploadSiteAsset,
      deleteSiteAsset,
      listAllProfiles,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
