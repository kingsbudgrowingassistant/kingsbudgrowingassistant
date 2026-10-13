"use client";

// DemoDataProvider — used ONLY when the user has NOT configured Supabase.
// Now with FUNCTIONAL CRUD — you can add, edit, and delete records in demo
// mode. Changes persist in memory until you refresh the page. This makes the
// demo feel real so you can test every feature before deploying.

import { useMemo, useState, type ReactNode } from "react";
import { DataContext, type DataContextValue } from "./data-context";
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
import {
  DEMO_DIRECTORS,
  DEMO_ELECTRICITY,
  DEMO_ENVIRONMENT_LOGS,
  DEMO_EXPENSES,
  DEMO_HARVESTS,
  DEMO_HARVEST_PHOTOS,
  DEMO_LIGHTS,
  DEMO_NUTRIENT_LOGS,
  DEMO_SALES,
  DEMO_SEASONS,
  DEMO_SETTINGS,
  DEMO_STRAINS,
  DEMO_TENTS,
  DEMO_PROFILE,
} from "./demo-data";

// Generic helpers for in-memory CRUD
function makeUpsert<T extends { id?: string }>(
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  defaults: Partial<T>
) {
  return async (item: Partial<T> & Record<string, unknown>) => {
    setter((prev) => {
      if (item.id) {
        return prev.map((p) => (p.id === item.id ? { ...p, ...item } as T : p));
      }
      const newItem = {
        ...defaults,
        ...item,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as T;
      return [newItem, ...prev];
    });
  };
}

function makeDelete<T extends { id: string }>(
  setter: React.Dispatch<React.SetStateAction<T[]>>
) {
  return async (id: string) => {
    setter((prev) => prev.filter((p) => p.id !== id));
  };
}

const DEMO_USER_ID = "demo-user-id";

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [tents, setTents] = useState<Tent[]>(DEMO_TENTS);
  const [lights, setLights] = useState<Light[]>(DEMO_LIGHTS);
  const [electricity, setElectricity] = useState<Electricity[]>(DEMO_ELECTRICITY);
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [harvests, setHarvests] = useState<Harvest[]>(DEMO_HARVESTS);
  const [harvestPhotos, setHarvestPhotos] = useState<HarvestPhoto[]>(DEMO_HARVEST_PHOTOS);
  const [nutrientLogs, setNutrientLogs] = useState<NutrientLog[]>(DEMO_NUTRIENT_LOGS);
  const [environmentLogs, setEnvironmentLogs] = useState<EnvironmentLog[]>(DEMO_ENVIRONMENT_LOGS);
  const [sales, setSales] = useState<Sale[]>(DEMO_SALES);
  const [seasons, setSeasons] = useState<Season[]>(DEMO_SEASONS);
  const [strains, setStrains] = useState<Strain[]>(DEMO_STRAINS);
  const [settings, setSettings] = useState<Settings | null>(DEMO_SETTINGS);
  const [directors, setDirectors] = useState<Director[]>(DEMO_DIRECTORS);

  const value = useMemo<DataContextValue>(
    () => ({
      loading: false,
      error: null,
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
      refetch: async () => {},
      // Functional CRUD — actually modifies in-memory state
      upsertTent: makeUpsert(setTents, { user_id: DEMO_USER_ID, status: "active" }) as DataContextValue["upsertTent"],
      deleteTent: makeDelete(setTents) as DataContextValue["deleteTent"],
      upsertLight: makeUpsert(setLights, { user_id: DEMO_USER_ID, quantity: 1, hours_per_day: 18, active: true }) as DataContextValue["upsertLight"],
      deleteLight: makeDelete(setLights) as DataContextValue["deleteLight"],
      upsertElectricity: makeUpsert(setElectricity, { user_id: DEMO_USER_ID, fixed_charge: 0 }) as DataContextValue["upsertElectricity"],
      deleteElectricity: makeDelete(setElectricity) as DataContextValue["deleteElectricity"],
      upsertExpense: makeUpsert(setExpenses, { user_id: DEMO_USER_ID, description: "" }) as DataContextValue["upsertExpense"],
      deleteExpense: makeDelete(setExpenses) as DataContextValue["deleteExpense"],
      upsertHarvest: makeUpsert(setHarvests, { user_id: DEMO_USER_ID, wet_weight: 0, dry_weight: 0 }) as DataContextValue["upsertHarvest"],
      deleteHarvest: makeDelete(setHarvests) as DataContextValue["deleteHarvest"],
      upsertStrain: makeUpsert(setStrains, { user_id: DEMO_USER_ID }) as DataContextValue["upsertStrain"],
      deleteStrain: makeDelete(setStrains) as DataContextValue["deleteStrain"],
      upsertNutrientLog: makeUpsert(setNutrientLogs, { user_id: DEMO_USER_ID }) as DataContextValue["upsertNutrientLog"],
      deleteNutrientLog: makeDelete(setNutrientLogs) as DataContextValue["deleteNutrientLog"],
      upsertEnvironmentLog: makeUpsert(setEnvironmentLogs, { user_id: DEMO_USER_ID }) as DataContextValue["upsertEnvironmentLog"],
      deleteEnvironmentLog: makeDelete(setEnvironmentLogs) as DataContextValue["deleteEnvironmentLog"],
      uploadHarvestPhoto: (async () => {}) as DataContextValue["uploadHarvestPhoto"],
      deleteHarvestPhoto: makeDelete(setHarvestPhotos) as DataContextValue["deleteHarvestPhoto"],
      getHarvestPhotoUrl: (async () => null) as DataContextValue["getHarvestPhotoUrl"],
      upsertSale: makeUpsert(setSales, { user_id: DEMO_USER_ID }) as DataContextValue["upsertSale"],
      deleteSale: makeDelete(setSales) as DataContextValue["deleteSale"],
      upsertSeason: makeUpsert(setSeasons, { user_id: DEMO_USER_ID, status: "active" }) as DataContextValue["upsertSeason"],
      deleteSeason: makeDelete(setSeasons) as DataContextValue["deleteSeason"],
      upsertSettings: (async (s: Partial<Settings>) => {
        setSettings((prev) => ({ ...(prev ?? DEMO_SETTINGS), ...s }));
      }) as DataContextValue["upsertSettings"],
      upsertDirector: makeUpsert(setDirectors, { user_id: DEMO_USER_ID, percentage: 0 }) as DataContextValue["upsertDirector"],
      deleteDirector: makeDelete(setDirectors) as DataContextValue["deleteDirector"],
      updateProfile: (async (p: Partial<Profile>) => {}) as DataContextValue["updateProfile"],
      // Admin helpers (no-ops in demo)
      upsertSiteSettings: (async () => {}) as DataContextValue["upsertSiteSettings"],
      uploadSiteAsset: (async () => {}) as DataContextValue["uploadSiteAsset"],
      deleteSiteAsset: (async () => {}) as DataContextValue["deleteSiteAsset"],
      listAllProfiles: (async () => [
        DEMO_PROFILE,
        { ...DEMO_PROFILE, id: "demo-profile-2", user_id: "demo-user-2", email: "user2@example.com", full_name: "Second User", is_admin: false },
      ]) as DataContextValue["listAllProfiles"],
    }),
    [tents, lights, electricity, expenses, harvests, harvestPhotos, nutrientLogs, environmentLogs, sales, seasons, strains, settings, directors]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
