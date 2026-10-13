// ---------------------------------------------------------------------------
// Business calculations for Kings Bud Grow Assistant.
// All formulas derived from the original spec — kWh, electricity costs,
// break-even, profit/loss, company & director distributions.
// ---------------------------------------------------------------------------

import type {
  Director,
  Electricity,
  Expense,
  Harvest,
  Light,
  Sale,
  Season,
  Settings,
  Tent,
} from "./supabase/types";

export const DEFAULT_SETTINGS: Omit<Settings, "id" | "user_id" | "created_at"> = {
  currency: "ZAR",
  electricity_tariff: 3.5, // ZAR per kWh (South African average)
  company_percentage: 25, // % of profit retained by the company
  director_count: 3,
};

export interface LightKpi {
  id: string;
  name: string;
  wattage: number;
  quantity: number;
  hours_per_day: number;
  totalWatts: number;
  dailyKwh: number;
  monthlyKwh: number;
  monthlyCost: number; // based on settings.electricity_tariff
  yearlyKwh: number;
  yearlyCost: number;
}

export interface DashboardKpis {
  totalTents: number;
  activeTents: number;
  totalLights: number;
  activeLights: number;
  totalMonthlyKwh: number;
  totalMonthlyElectricityCost: number; // computed from lights
  monthlyFixedCharge: number; // from latest electricity record
  monthlyOverheads: number; // electricity + monthly expenses (this month)
  monthlyExpenses: number; // expenses dated in current month
  totalExpensesAllTime: number;
  totalHarvestsWet: number; // grams
  totalHarvestsDry: number; // grams
  totalRevenue: number;
  totalSalesGrams: number;
  grossProfit: number; // revenue - totalExpensesAllTime
  companyShare: number;
  directorShare: number;
  averagePricePerGram: number;
  breakEvenGrams: number; // grams needed at avg price to cover monthly overheads
  breakEvenCurrency: number;
}

const isSameMonth = (dateStr: string, ref: Date) => {
  const d = new Date(dateStr);
  return (
    d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
  );
};

export function computeLightKpi(
  light: Pick<
    Light,
    "id" | "name" | "wattage" | "quantity" | "hours_per_day"
  >,
  tariffPerKwh: number
): LightKpi {
  const totalWatts = light.wattage * light.quantity;
  const dailyKwh = (totalWatts * light.hours_per_day) / 1000;
  const monthlyKwh = dailyKwh * 30; // 30-day month
  const yearlyKwh = dailyKwh * 365;
  return {
    id: light.id,
    name: light.name,
    wattage: light.wattage,
    quantity: light.quantity,
    hours_per_day: light.hours_per_day,
    totalWatts,
    dailyKwh,
    monthlyKwh,
    monthlyCost: monthlyKwh * tariffPerKwh,
    yearlyKwh,
    yearlyCost: yearlyKwh * tariffPerKwh,
  };
}

export function computeDashboardKpis(args: {
  tents: Tent[];
  lights: Light[];
  electricity: Electricity[];
  expenses: Expense[];
  harvests: Harvest[];
  sales: Sale[];
  settings: Settings | null;
  directors: Director[];
}): DashboardKpis {
  const {
    tents,
    lights,
    electricity,
    expenses,
    harvests,
    sales,
    settings,
    directors,
  } = args;

  const tariff = settings?.electricity_tariff ?? DEFAULT_SETTINGS.electricity_tariff;
  const companyPct = settings?.company_percentage ?? DEFAULT_SETTINGS.company_percentage;

  const totalTents = tents.length;
  const activeTents = tents.filter((t) => t.status === "active").length;
  const totalLights = lights.reduce((s, l) => s + l.quantity, 0);
  const activeLights = lights
    .filter((l) => l.active)
    .reduce((s, l) => s + l.quantity, 0);

  const lightKpis = lights.map((l) => computeLightKpi(l, tariff));
  const totalMonthlyKwh = lightKpis.reduce((s, k) => s + k.monthlyKwh, 0);
  const totalMonthlyElectricityCost = lightKpis.reduce(
    (s, k) => s + k.monthlyCost,
    0
  );

  const now = new Date();
  const latestElectricity = electricity
    .slice()
    .sort((a, b) => (a.month < b.month ? 1 : -1))[0];
  const monthlyFixedCharge = latestElectricity?.fixed_charge ?? 0;

  const monthlyExpenses = expenses
    .filter((e) => isSameMonth(e.date, now))
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalExpensesAllTime = expenses.reduce(
    (s, e) => s + Number(e.amount),
    0
  );

  const totalHarvestsWet = harvests.reduce((s, h) => s + Number(h.wet_weight), 0);
  const totalHarvestsDry = harvests.reduce((s, h) => s + Number(h.dry_weight), 0);

  const totalRevenue = sales.reduce((s, sa) => s + Number(sa.revenue), 0);
  const totalSalesGrams = sales.reduce((s, sa) => s + Number(sa.quantity), 0);
  const averagePricePerGram =
    totalSalesGrams > 0 ? totalRevenue / totalSalesGrams : 0;

  const monthlyOverheads =
    totalMonthlyElectricityCost + monthlyFixedCharge + monthlyExpenses;

  const grossProfit = totalRevenue - totalExpensesAllTime;
  const companyShare = grossProfit > 0 ? (grossProfit * companyPct) / 100 : 0;
  const directorShare = grossProfit > 0 ? grossProfit - companyShare : 0;

  const breakEvenCurrency = monthlyOverheads;
  const breakEvenGrams =
    averagePricePerGram > 0
      ? monthlyOverheads / averagePricePerGram
      : 0;

  return {
    totalTents,
    activeTents,
    totalLights,
    activeLights,
    totalMonthlyKwh,
    totalMonthlyElectricityCost,
    monthlyFixedCharge,
    monthlyOverheads,
    monthlyExpenses,
    totalExpensesAllTime,
    totalHarvestsWet,
    totalHarvestsDry,
    totalRevenue,
    totalSalesGrams,
    grossProfit,
    companyShare,
    directorShare,
    averagePricePerGram,
    breakEvenGrams,
    breakEvenCurrency,
  };
}

// Director split — falls back to equal split if percentages don't sum to 100.
export function computeDirectorSplits(
  directors: Director[],
  directorPool: number
): { director: Director; amount: number; effectivePercentage: number }[] {
  if (directors.length === 0) return [];
  const totalPct = directors.reduce((s, d) => s + Number(d.percentage), 0);
  return directors.map((d) => {
    const effective =
      totalPct > 0 ? Number(d.percentage) / totalPct : 1 / directors.length;
    return {
      director: d,
      amount: directorPool * effective,
      effectivePercentage: effective * 100,
    };
  });
}

// Monthly aggregation helpers (for charts).
export function monthlySeries(items: { date: string; value: number }[]) {
  const buckets: Record<string, number> = {};
  for (const item of items) {
    const d = new Date(item.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets[key] = (buckets[key] ?? 0) + item.value;
  }
  return Object.entries(buckets)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, value]) => ({ month, value }));
}

// Season-scoped helpers.
export function filterBySeason<
  T extends { season_id: string | null }
>(items: T[], seasonId: string | null): T[] {
  if (!seasonId) return items;
  return items.filter((i) => i.season_id === seasonId);
}

// Calculate season profitability.
export function computeSeasonKpis(
  season: Season,
  sales: Sale[],
  expenses: Expense[]
) {
  const seasonSales = filterBySeason(sales, season.id);
  const seasonExpenses = filterBySeason(expenses, season.id);
  const revenue = seasonSales.reduce((s, x) => s + Number(x.revenue), 0);
  const cost = seasonExpenses.reduce((s, x) => s + Number(x.amount), 0);
  const profit = revenue - cost;
  return {
    revenue,
    cost,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    salesCount: seasonSales.length,
    expenseCount: seasonExpenses.length,
  };
}

// ---------------------------------------------------------------------------
// Yield-per-watt efficiency — how many grams of dry yield are produced per
// watt of installed lighting. Higher = more efficient use of electricity.
//
// Calculation per harvest:
//   - Determine which lights were active during the harvest's date range.
//     (Conservative: any active light on a tent linked to the harvest.)
//   - Sum totalWatts = Σ(wattage × quantity) of those lights.
//   - yieldPerWatt = dry_weight_grams / totalWatts
//
// If the harvest has no linked tent or no active lights, the result is null.
// ---------------------------------------------------------------------------

export interface YieldPerWattRow {
  harvestId: string;
  cycleName: string;
  tentName: string | null;
  strainName: string | null;
  harvestDate: string | null;
  dryGrams: number;
  wetGrams: number;
  totalWatts: number | null;
  yieldPerWatt: number | null;    // grams per watt
  gramsPerKwh: number | null;     // grams per kWh consumed during flowering
}

export function computeYieldPerWatt(args: {
  harvests: Harvest[];
  tents: Tent[];
  lights: Light[];
  strains: { id: string; name: string }[];
}): YieldPerWattRow[] {
  const { harvests, tents, lights, strains } = args;
  const rows: YieldPerWattRow[] = [];

  for (const h of harvests) {
    const tent = h.tent_id
      ? tents.find((t) => t.id === h.tent_id) ?? null
      : null;
    const strain = h.strain_id
      ? strains.find((s) => s.id === h.strain_id) ?? null
      : null;

    // Lights linked to this tent (or all lights if no tent).
    const linkedLights = tent
      ? lights.filter((l) => l.tent_id === tent.id)
      : lights;

    const activeLights = linkedLights.filter((l) => {
      // Filter by harvest_date range if set, otherwise include all active lights.
      if (!l.active) return false;
      const start = l.start_date ? new Date(l.start_date) : null;
      const end = l.end_date ? new Date(l.end_date) : null;
      const harvestD = h.harvest_date ? new Date(h.harvest_date) : null;
      if (!harvestD) return true;
      if (start && harvestD < start) return false;
      if (end && harvestD > end) return false;
      return true;
    });

    const totalWatts = activeLights.length > 0
      ? activeLights.reduce((s, l) => s + l.wattage * l.quantity, 0)
      : null;

    const dry = Number(h.dry_weight);
    const yieldPerWatt = totalWatts && totalWatts > 0 ? dry / totalWatts : null;

    // grams per kWh = dry / (totalWatts × hours_per_day × flowering_days / 1000)
    // flowering_days ≈ 7 × flowering_weeks from strain if known, else 60 days.
    let gramsPerKwh: number | null = null;
    if (totalWatts && totalWatts > 0) {
      const hours = activeLights.reduce(
        (s, l) => s + l.hours_per_day * l.quantity,
        0
      ) / Math.max(activeLights.length, 1);
      const floweringWeeks = strain?.flowering_weeks ?? 8;
      const floweringDays = floweringWeeks * 7;
      const kwh = (totalWatts * hours * floweringDays) / 1000;
      gramsPerKwh = kwh > 0 ? dry / kwh : null;
    }

    rows.push({
      harvestId: h.id,
      cycleName: h.cycle_name,
      tentName: tent?.name ?? null,
      strainName: strain?.name ?? null,
      harvestDate: h.harvest_date,
      dryGrams: dry,
      wetGrams: Number(h.wet_weight),
      totalWatts,
      yieldPerWatt,
      gramsPerKwh,
    });
  }

  return rows;
}

// Aggregate efficiency stats across all harvests.
export function computeEfficiencySummary(rows: YieldPerWattRow[]) {
  const withYpw = rows.filter((r) => r.yieldPerWatt != null);
  const withGpk = rows.filter((r) => r.gramsPerKwh != null);
  const totalDry = rows.reduce((s, r) => s + r.dryGrams, 0);
  const totalWatts = withYpw.reduce((s, r) => s + (r.totalWatts ?? 0), 0);
  return {
    harvestCount: rows.length,
    totalDryGrams: totalDry,
    avgYieldPerWatt:
      withYpw.length > 0
        ? withYpw.reduce((s, r) => s + (r.yieldPerWatt ?? 0), 0) / withYpw.length
        : 0,
    avgGramsPerKwh:
      withGpk.length > 0
        ? withGpk.reduce((s, r) => s + (r.gramsPerKwh ?? 0), 0) / withGpk.length
        : 0,
    overallYieldPerWatt:
      totalWatts > 0 ? totalDry / totalWatts : 0,
  };
}
