// ---------------------------------------------------------------------------
// Demo data — used ONLY when the user explicitly opts into "Preview Mode"
// from the Configure Supabase notice. This data is in-memory only and never
// persisted to localStorage. It exists purely so users can explore the
// dashboard UI before deploying with a real Supabase project.
// ---------------------------------------------------------------------------

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
  Strain,
  Tent,
} from "./supabase/types";

const NOW = new Date();
const ISO = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return ISO(d);
};
const monthsAgo = (n: number) => {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - n);
  return ISO(d);
};
const monthKey = (n: number) => {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const DEMO_USER_ID = "demo-user-id";

export const DEMO_PROFILE: Profile = {
  id: "demo-profile-id",
  user_id: DEMO_USER_ID,
  full_name: "Demo Grower",
  email: "demo@kingsbud.example",
  business_name: "Kings Bud Cultivation (Demo)",
  is_admin: true,
  created_at: monthsAgo(8),
};

export const DEMO_SETTINGS: Settings = {
  id: "demo-settings-id",
  user_id: DEMO_USER_ID,
  currency: "ZAR",
  electricity_tariff: 3.5,
  company_percentage: 25,
  director_count: 3,
  created_at: monthsAgo(8),
};

export const DEMO_SEASONS: Season[] = [
  {
    id: "season-1",
    user_id: DEMO_USER_ID,
    name: "2024 Winter Cycle",
    start_date: monthsAgo(8),
    end_date: monthsAgo(5),
    status: "completed",
    created_at: monthsAgo(8),
  },
  {
    id: "season-2",
    user_id: DEMO_USER_ID,
    name: "2025 Summer Cycle",
    start_date: monthsAgo(4),
    end_date: null,
    status: "active",
    created_at: monthsAgo(4),
  },
];

export const DEMO_STRAINS: Strain[] = [
  {
    id: "strain-1",
    user_id: DEMO_USER_ID,
    name: "Critical Mass",
    breeder: "Mr. Nice Seeds",
    type: "hybrid",
    thc_percent: 19,
    cbd_percent: 0.4,
    flowering_weeks: 8,
    expected_yield_grams: 500,
    lineage: "Critical Mass × Afghani",
    description:
      "Heavy-yielding indica-dominant hybrid. Dense buds, sweet earthy aroma. Great for evening use.",
    created_at: monthsAgo(8),
  },
  {
    id: "strain-2",
    user_id: DEMO_USER_ID,
    name: "Northern Lights",
    breeder: "Sensi Seeds",
    type: "indica",
    thc_percent: 18,
    cbd_percent: 0.3,
    flowering_weeks: 7,
    expected_yield_grams: 450,
    lineage: "Afghani × Thai",
    description:
      "Classic pure indica. Resinous, fast-flowering, forgiving of new growers.",
    created_at: monthsAgo(8),
  },
  {
    id: "strain-3",
    user_id: DEMO_USER_ID,
    name: "Sour Diesel",
    breeder: "East Coast",
    type: "sativa",
    thc_percent: 22,
    cbd_percent: 0.2,
    flowering_weeks: 10,
    expected_yield_grams: 400,
    lineage: "Chemdog 91 × Super Skunk",
    description:
      "Energising sativa with a pungent fuel aroma. Long flowering but premium price per gram.",
    created_at: monthsAgo(6),
  },
];

export const DEMO_TENTS: Tent[] = [
  {
    id: "tent-1",
    user_id: DEMO_USER_ID,
    name: "Flower Tent 1",
    location: "Spare room",
    dimensions: "1.2m × 1.2m × 2m",
    status: "active",
    notes: "600W HPS, 4 plants",
    created_at: monthsAgo(8),
  },
  {
    id: "tent-2",
    user_id: DEMO_USER_ID,
    name: "Veg Tent",
    location: "Spare room",
    dimensions: "0.8m × 0.8m × 1.6m",
    status: "active",
    notes: "T5 fluorescent, mothers and clones",
    created_at: monthsAgo(8),
  },
  {
    id: "tent-3",
    user_id: DEMO_USER_ID,
    name: "Drying Tent",
    location: "Garage",
    dimensions: "1m × 0.5m × 1.5m",
    status: "maintenance",
    notes: "Currently being cleaned",
    created_at: monthsAgo(6),
  },
];

export const DEMO_LIGHTS: Light[] = [
  {
    id: "light-1",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    name: "600W HPS",
    wattage: 600,
    quantity: 1,
    hours_per_day: 12,
    active: true,
    start_date: monthsAgo(4),
    end_date: null,
    created_at: monthsAgo(4),
  },
  {
    id: "light-2",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    name: "Cob LED supplement",
    wattage: 150,
    quantity: 2,
    hours_per_day: 12,
    active: true,
    start_date: monthsAgo(4),
    end_date: null,
    created_at: monthsAgo(4),
  },
  {
    id: "light-3",
    user_id: DEMO_USER_ID,
    tent_id: "tent-2",
    name: "T5 4ft 8-bulb",
    wattage: 216,
    quantity: 1,
    hours_per_day: 18,
    active: true,
    start_date: monthsAgo(8),
    end_date: null,
    created_at: monthsAgo(8),
  },
  {
    id: "light-4",
    user_id: DEMO_USER_ID,
    tent_id: "tent-2",
    name: "Propagation LED",
    wattage: 60,
    quantity: 1,
    hours_per_day: 18,
    active: false,
    start_date: monthsAgo(8),
    end_date: monthsAgo(2),
    created_at: monthsAgo(8),
  },
];

export const DEMO_ELECTRICITY: Electricity[] = [
  {
    id: "elec-1",
    user_id: DEMO_USER_ID,
    month: monthKey(0),
    tariff: 3.65,
    fixed_charge: 250,
    notes: "Summer tariff, city surcharge",
    created_at: daysAgo(5),
  },
  {
    id: "elec-2",
    user_id: DEMO_USER_ID,
    month: monthKey(1),
    tariff: 3.5,
    fixed_charge: 250,
    notes: "",
    created_at: daysAgo(35),
  },
  {
    id: "elec-3",
    user_id: DEMO_USER_ID,
    month: monthKey(2),
    tariff: 3.45,
    fixed_charge: 250,
    notes: "",
    created_at: daysAgo(65),
  },
];

export const DEMO_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    user_id: DEMO_USER_ID,
    category: "Nutrients",
    description: "FloraNova bloom + grow",
    amount: 850,
    date: daysAgo(3),
    tent_id: "tent-1",
    season_id: "season-2",
    created_at: daysAgo(3),
  },
  {
    id: "exp-2",
    user_id: DEMO_USER_ID,
    category: "Substrate / Medium",
    description: "Coco coir 50L bales × 4",
    amount: 640,
    date: daysAgo(7),
    tent_id: null,
    season_id: "season-2",
    created_at: daysAgo(7),
  },
  {
    id: "exp-3",
    user_id: DEMO_USER_ID,
    category: "Equipment",
    description: "Carbon filter + ducting",
    amount: 1200,
    date: daysAgo(20),
    tent_id: "tent-1",
    season_id: "season-2",
    created_at: daysAgo(20),
  },
  {
    id: "exp-4",
    user_id: DEMO_USER_ID,
    category: "Rent",
    description: "Garage share (monthly)",
    amount: 1500,
    date: daysAgo(28),
    tent_id: null,
    season_id: null,
    created_at: daysAgo(28),
  },
  {
    id: "exp-5",
    user_id: DEMO_USER_ID,
    category: "Seeds",
    description: "Critical Mass feminised × 10",
    amount: 950,
    date: monthsAgo(4),
    tent_id: null,
    season_id: "season-2",
    created_at: monthsAgo(4),
  },
  {
    id: "exp-6",
    user_id: DEMO_USER_ID,
    category: "Labour",
    description: "Trim help — week 9",
    amount: 2000,
    date: daysAgo(45),
    tent_id: "tent-1",
    season_id: "season-2",
    created_at: daysAgo(45),
  },
];

export const DEMO_HARVESTS: Harvest[] = [
  {
    id: "harv-1",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    strain_id: "strain-1",
    cycle_name: "Cycle 1 — Critical Mass",
    start_date: monthsAgo(8),
    harvest_date: monthsAgo(5),
    wet_weight: 1850,
    dry_weight: 540,
    notes: "Excellent yield, dense nugs.",
    created_at: monthsAgo(5),
  },
  {
    id: "harv-2",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    strain_id: "strain-1",
    cycle_name: "Cycle 2 — Critical Mass",
    start_date: monthsAgo(2),
    harvest_date: daysAgo(20),
    wet_weight: 2100,
    dry_weight: 610,
    notes: "Best run so far.",
    created_at: daysAgo(20),
  },
];

export const DEMO_HARVEST_PHOTOS: HarvestPhoto[] = [
  {
    id: "photo-1",
    user_id: DEMO_USER_ID,
    harvest_id: "harv-2",
    storage_path: "demo/photo-1.jpg",
    file_name: "harvest-day.jpg",
    mime_type: "image/jpeg",
    size_bytes: 412000,
    caption: "Harvest day — full plant",
    created_at: daysAgo(20),
  },
  {
    id: "photo-2",
    user_id: DEMO_USER_ID,
    harvest_id: "harv-2",
    storage_path: "demo/photo-2.jpg",
    file_name: "dry-trim.jpg",
    mime_type: "image/jpeg",
    size_bytes: 318000,
    caption: "After dry trim — ready to cure",
    created_at: daysAgo(18),
  },
  {
    id: "photo-3",
    user_id: DEMO_USER_ID,
    harvest_id: "harv-1",
    storage_path: "demo/photo-3.jpg",
    file_name: "last-cycle-cm.jpg",
    mime_type: "image/jpeg",
    size_bytes: 286000,
    caption: "Critical Mass — Cycle 1 close-up",
    created_at: monthsAgo(5),
  },
];

export const DEMO_NUTRIENT_LOGS: NutrientLog[] = [
  {
    id: "nut-1",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    strain_id: "strain-1",
    season_id: "season-2",
    logged_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    nutrient_mix: "FloraNova Bloom 2ml/L + CalMag 1ml/L",
    amount_ml: 1500,
    water_ph: 6.2,
    water_ec: 1.8,
    runoff_ph: 6.5,
    runoff_ec: 2.4,
    notes: "All plants drank fast — root zone healthy.",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "nut-2",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    strain_id: "strain-1",
    season_id: "season-2",
    logged_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    nutrient_mix: "FloraNova Bloom 1.5ml/L + CalMag 1ml/L + B-52 0.5ml/L",
    amount_ml: 1500,
    water_ph: 6.3,
    water_ec: 1.7,
    runoff_ph: 6.6,
    runoff_ec: 2.2,
    notes: "Tipped slightly lower EC — runoff came down nicely.",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "nut-3",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    strain_id: "strain-1",
    season_id: "season-2",
    logged_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nutrient_mix: "Plain water flush — 3x pot volume",
    amount_ml: 4500,
    water_ph: 6.5,
    water_ec: 0.0,
    runoff_ph: 6.4,
    runoff_ec: 1.1,
    notes: "Pre-harvest flush. Runoff EC dropped sharply.",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "nut-4",
    user_id: DEMO_USER_ID,
    tent_id: "tent-2",
    strain_id: "strain-2",
    season_id: "season-2",
    logged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    nutrient_mix: "FloraNova Grow 2ml/L + CalMag 1ml/L",
    amount_ml: 800,
    water_ph: 5.9,
    water_ec: 1.4,
    runoff_ph: 6.1,
    runoff_ec: 1.6,
    notes: "Veg tent, light feeding.",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_ENVIRONMENT_LOGS: EnvironmentLog[] = [
  {
    id: "env-1",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    logged_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    temp_c: 25.5,
    humidity_pct: 48,
    notes: "Day cycle — lights on, exhaust fan ramped.",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "env-2",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    logged_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    temp_c: 21.0,
    humidity_pct: 62,
    notes: "Night cycle — lights off.",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "env-3",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    logged_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    temp_c: 27.5,
    humidity_pct: 70,
    notes: "⚠ Hot afternoon — exhaust couldn't keep up. RH climbing.",
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "env-4",
    user_id: DEMO_USER_ID,
    tent_id: "tent-1",
    logged_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    temp_c: 24.0,
    humidity_pct: 53,
    notes: "Day cycle, comfortable range.",
    created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "env-5",
    user_id: DEMO_USER_ID,
    tent_id: "tent-2",
    logged_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    temp_c: 23.0,
    humidity_pct: 65,
    notes: "Veg tent day cycle.",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "env-6",
    user_id: DEMO_USER_ID,
    tent_id: "tent-2",
    logged_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    temp_c: 22.0,
    humidity_pct: 72,
    notes: "Night cycle — humidifier running.",
    created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_SALES: Sale[] = [
  {
    id: "sale-1",
    user_id: DEMO_USER_ID,
    date: daysAgo(2),
    product: "Critical Mass — top shelf",
    quantity: 100,
    price_per_gram: 80,
    revenue: 8000,
    season_id: "season-2",
    created_at: daysAgo(2),
  },
  {
    id: "sale-2",
    user_id: DEMO_USER_ID,
    date: daysAgo(10),
    product: "Critical Mass — top shelf",
    quantity: 50,
    price_per_gram: 85,
    revenue: 4250,
    season_id: "season-2",
    created_at: daysAgo(10),
  },
  {
    id: "sale-3",
    user_id: DEMO_USER_ID,
    date: daysAgo(18),
    product: "Critical Mass — popcorn",
    quantity: 80,
    price_per_gram: 50,
    revenue: 4000,
    season_id: "season-2",
    created_at: daysAgo(18),
  },
  {
    id: "sale-4",
    user_id: DEMO_USER_ID,
    date: monthsAgo(5),
    product: "Critical Mass — top shelf",
    quantity: 200,
    price_per_gram: 75,
    revenue: 15000,
    season_id: "season-1",
    created_at: monthsAgo(5),
  },
  {
    id: "sale-5",
    user_id: DEMO_USER_ID,
    date: monthsAgo(6),
    product: "Critical Mass — trim",
    quantity: 150,
    price_per_gram: 25,
    revenue: 3750,
    season_id: "season-1",
    created_at: monthsAgo(6),
  },
];

export const DEMO_DIRECTORS: Director[] = [
  {
    id: "dir-1",
    user_id: DEMO_USER_ID,
    name: "Jane Doe",
    percentage: 25,
    created_at: monthsAgo(8),
  },
  {
    id: "dir-2",
    user_id: DEMO_USER_ID,
    name: "John Smith",
    percentage: 25,
    created_at: monthsAgo(8),
  },
  {
    id: "dir-3",
    user_id: DEMO_USER_ID,
    name: "Sam Lee",
    percentage: 25,
    created_at: monthsAgo(8),
  },
];

export const DEMO_DEMO_FLAG_KEY = "kings-bud-demo-mode";
