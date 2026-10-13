"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import {
  computeDashboardKpis,
  computeSeasonKpis,
  computeYieldPerWatt,
  computeEfficiencySummary,
} from "@/lib/calculations";
import { formatCurrency, formatDate, formatGrams, formatMonthLabel, formatNumber } from "@/lib/format";
import { SectionHeader } from "../section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Bar,
  Line,
  Doughnut,
} from "@/components/dashboard/charts";
import { FileBarChart, Download, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const PALETTE = [
  "#16a34a", // green
  "#d97706", // amber
  "#3b82f6", // blue
  "#dc2626", // red
  "#9333ea", // purple
  "#0d9488", // teal
];
const PALETTE_SOFT = PALETTE.map((c) => hexToRgba(c, 0.25));

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ReportsSection() {
  const data = useData();
  const [seasonId, setSeasonId] = useState<string>("all");

  const currency = data.settings?.currency ?? "ZAR";

  const filteredSales = useMemo(
    () =>
      seasonId === "all"
        ? data.sales
        : data.sales.filter((s) => s.season_id === seasonId),
    [data.sales, seasonId]
  );
  const filteredExpenses = useMemo(
    () =>
      seasonId === "all"
        ? data.expenses
        : data.expenses.filter((e) => e.season_id === seasonId),
    [data.expenses, seasonId]
  );
  const filteredHarvests = useMemo(
    () =>
      seasonId === "all"
        ? data.harvests
        : data.harvests.filter(
            (h) =>
              data.expenses.some((e) => e.season_id === seasonId && e.tent_id === h.tent_id) ||
              data.sales.some((s) => s.season_id === seasonId)
          ),
    [data.harvests, data.expenses, data.sales, seasonId]
  );

  const revenueByMonth = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const s of filteredSales) {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[k] = (buckets[k] ?? 0) + Number(s.revenue);
    }
    return Object.entries(buckets)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, value]) => ({ month, value }));
  }, [filteredSales]);

  const expenseByMonth = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const e of filteredExpenses) {
      const d = new Date(e.date);
      if (isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[k] = (buckets[k] ?? 0) + Number(e.amount);
    }
    return Object.entries(buckets)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, value]) => ({ month, value }));
  }, [filteredExpenses]);

  const profitByMonth = useMemo(() => {
    const allMonths = Array.from(
      new Set([
        ...revenueByMonth.map((r) => r.month),
        ...expenseByMonth.map((r) => r.month),
      ])
    ).sort();
    return allMonths.map((m) => {
      const r = revenueByMonth.find((x) => x.month === m)?.value ?? 0;
      const e = expenseByMonth.find((x) => x.month === m)?.value ?? 0;
      return { month: m, profit: r - e };
    });
  }, [revenueByMonth, expenseByMonth]);

  const harvestByMonth = useMemo(() => {
    const buckets: Record<string, { wet: number; dry: number }> = {};
    for (const h of data.harvests) {
      const d = new Date(h.harvest_date ?? h.created_at);
      if (isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[k] = buckets[k] ?? { wet: 0, dry: 0 };
      buckets[k].wet += Number(h.wet_weight);
      buckets[k].dry += Number(h.dry_weight);
    }
    return Object.entries(buckets)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, v]) => ({ month, ...v }));
  }, [data.harvests]);

  const expensesByCategory = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const e of filteredExpenses) {
      buckets[e.category] = (buckets[e.category] ?? 0) + Number(e.amount);
    }
    return Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .map(([category, value]) => ({ category, value }));
  }, [filteredExpenses]);

  const salesByProduct = useMemo(() => {
    const buckets: Record<string, { grams: number; revenue: number }> = {};
    for (const s of filteredSales) {
      buckets[s.product] = buckets[s.product] ?? { grams: 0, revenue: 0 };
      buckets[s.product].grams += Number(s.quantity);
      buckets[s.product].revenue += Number(s.revenue);
    }
    return Object.entries(buckets)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([product, v]) => ({ product, ...v }));
  }, [filteredSales]);

  const seasonKpis = useMemo(() => {
    return data.seasons.map((s) => ({
      season: s,
      kpis: computeSeasonKpis(s, data.sales, data.expenses),
    }));
  }, [data.seasons, data.sales, data.expenses]);

  const dashboardKpis = computeDashboardKpis({
    tents: data.tents,
    lights: data.lights,
    electricity: data.electricity,
    expenses: filteredExpenses,
    harvests: filteredHarvests,
    sales: filteredSales,
    settings: data.settings,
    directors: data.directors,
  });

  const allMonths = Array.from(
    new Set([
      ...revenueByMonth.map((r) => r.month),
      ...expenseByMonth.map((r) => r.month),
    ])
  ).sort();

  // CSV export
  const exportCsv = () => {
    const lines: string[] = [];
    lines.push("Type,Date,Category/Product,Quantity,Amount(ZAR)");
    for (const e of filteredExpenses) {
      lines.push(
        `Expense,${e.date},"${e.category}","${e.description ?? ""}",${e.amount}`
      );
    }
    for (const s of filteredSales) {
      lines.push(
        `Sale,${s.date},"${s.product}",${s.quantity},${s.revenue}`
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kings-bud-report-${seasonId}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeader
        title="Reports"
        description="Comprehensive visualisations of your revenue, expenses, harvests and profitability. Filter by season or view all-time totals."
        extra={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Filter by season
              </Label>
              <Select value={seasonId} onValueChange={setSeasonId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  {data.seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Metric
              label="Revenue (filtered)"
              value={formatCurrency(dashboardKpis.totalRevenue, currency)}
            />
            <Metric
              label="Expenses (filtered)"
              value={formatCurrency(dashboardKpis.totalExpensesAllTime, currency)}
              tone="destructive"
            />
            <Metric
              label="Profit"
              value={formatCurrency(dashboardKpis.grossProfit, currency)}
              tone={dashboardKpis.grossProfit >= 0 ? "primary" : "destructive"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Revenue vs
              Expenses
            </CardTitle>
            <CardDescription>Monthly trend.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <Line
              data={{
                labels: allMonths.map(formatMonthLabel),
                datasets: [
                  {
                    label: "Revenue",
                    data: allMonths.map(
                      (m) =>
                        revenueByMonth.find((r) => r.month === m)?.value ?? 0
                    ),
                    borderColor: PALETTE[0],
                    backgroundColor: PALETTE_SOFT[0],
                    tension: 0.35,
                    fill: true,
                  },
                  {
                    label: "Expenses",
                    data: allMonths.map(
                      (m) =>
                        expenseByMonth.find((r) => r.month === m)?.value ?? 0
                    ),
                    borderColor: PALETTE[3],
                    backgroundColor: PALETTE_SOFT[3],
                    tension: 0.35,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top", labels: { font: { size: 11 } } },
                },
                scales: {
                  y: { ticks: { font: { size: 10 } } },
                  x: { ticks: { font: { size: 10 } } },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {dashboardKpis.grossProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}{" "}
              Monthly Profit / Loss
            </CardTitle>
            <CardDescription>Revenue minus expenses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <Bar
              data={{
                labels: profitByMonth.map((p) => formatMonthLabel(p.month)),
                datasets: [
                  {
                    label: "Profit",
                    data: profitByMonth.map((p) => p.profit),
                    backgroundColor: profitByMonth.map((p) =>
                      p.profit >= 0 ? PALETTE[0] : PALETTE[3]
                    ),
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { ticks: { font: { size: 10 } } },
                  x: { ticks: { font: { size: 10 } } },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-primary" /> Expenses by
              category
            </CardTitle>
            <CardDescription>Where the money goes.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expensesByCategory.length === 0 ? (
              <Empty />
            ) : (
              <Doughnut
                data={{
                  labels: expensesByCategory.map((e) => e.category),
                  datasets: [
                    {
                      data: expensesByCategory.map((e) => e.value),
                      backgroundColor: expensesByCategory.map(
                        (_, i) => PALETTE[i % PALETTE.length]
                      ),
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } },
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-primary" /> Harvest yield
            </CardTitle>
            <CardDescription>Wet vs dry grams per month.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {harvestByMonth.length === 0 ? (
              <Empty />
            ) : (
              <Bar
                data={{
                  labels: harvestByMonth.map((h) => formatMonthLabel(h.month)),
                  datasets: [
                    {
                      label: "Wet",
                      data: harvestByMonth.map((h) => h.wet),
                      backgroundColor: PALETTE[1],
                    },
                    {
                      label: "Dry",
                      data: harvestByMonth.map((h) => h.dry),
                      backgroundColor: PALETTE[0],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
                  scales: {
                    y: { ticks: { font: { size: 10 } } },
                    x: { ticks: { font: { size: 10 } } },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products by revenue</CardTitle>
            <CardDescription>
              Best-selling strains/products.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {salesByProduct.length === 0 ? (
              <Empty />
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Product</th>
                      <th className="text-right p-3">Grams</th>
                      <th className="text-right p-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByProduct.map((p) => (
                      <tr key={p.product} className="border-b border-border">
                        <td className="p-3 font-medium">{p.product}</td>
                        <td className="text-right p-3">
                          {formatGrams(p.grams)}
                        </td>
                        <td className="text-right p-3 font-semibold text-primary">
                          {formatCurrency(p.revenue, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-season profitability</CardTitle>
            <CardDescription>Season-by-season P&amp;L.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {seasonKpis.length === 0 ? (
              <Empty />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Season</th>
                      <th className="text-right p-3">Revenue</th>
                      <th className="text-right p-3">Cost</th>
                      <th className="text-right p-3">Profit</th>
                      <th className="text-right p-3">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonKpis.map(({ season, kpis }) => (
                      <tr key={season.id} className="border-b border-border">
                        <td className="p-3 font-medium">{season.name}</td>
                        <td className="text-right p-3">
                          {formatCurrency(kpis.revenue, currency)}
                        </td>
                        <td className="text-right p-3 text-destructive">
                          {formatCurrency(kpis.cost, currency)}
                        </td>
                        <td
                          className={`text-right p-3 font-semibold ${
                            kpis.profit >= 0 ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {formatCurrency(kpis.profit, currency)}
                        </td>
                        <td className="text-right p-3">
                          {formatNumber(kpis.margin, 1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <YieldPerWattReport />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Yield-per-watt efficiency report
// ---------------------------------------------------------------------------
function YieldPerWattReport() {
  const data = useData();
  const currency = data.settings?.currency ?? "ZAR";

  const rows = useMemo(
    () =>
      computeYieldPerWatt({
        harvests: data.harvests,
        tents: data.tents,
        lights: data.lights,
        strains: data.strains,
      }),
    [data.harvests, data.tents, data.lights, data.strains]
  );

  const summary = useMemo(() => computeEfficiencySummary(rows), [rows]);

  // Bar chart: yield-per-watt by harvest (sorted by harvest_date desc).
  const chartRows = useMemo(
    () =>
      rows
        .filter((r) => r.yieldPerWatt != null)
        .slice()
        .sort((a, b) => {
          const aDate = a.harvestDate ? new Date(a.harvestDate).getTime() : 0;
          const bDate = b.harvestDate ? new Date(b.harvestDate).getTime() : 0;
          return bDate - aDate;
        }),
    [rows]
  );

  return (
    <div className="grid lg:grid-cols-3 gap-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Yield-per-watt
          </CardTitle>
          <CardDescription>
            Dry grams produced per watt of installed lighting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Metric
            label="Overall yield/watt"
            value={`${formatNumber(summary.overallYieldPerWatt, 2)} g/W`}
            tone="primary"
          />
          <Metric
            label="Average per harvest"
            value={`${formatNumber(summary.avgYieldPerWatt, 2)} g/W`}
          />
          <Metric
            label="Average grams/kWh"
            value={`${formatNumber(summary.avgGramsPerKwh, 2)} g/kWh`}
          />
          <div className="text-[11px] text-muted-foreground pt-2 border-t border-border">
            Total dry yield: <strong>{formatGrams(summary.totalDryGrams)}</strong> across{" "}
            <strong>{summary.harvestCount}</strong> harvest
            {summary.harvestCount !== 1 ? "s" : ""}.
          </div>
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200">
            <strong>Benchmark:</strong> indoor grows typically achieve
            0.5–1.2 g/W. Top-tier setups can hit 1.5+ g/W. Below 0.4 g/W
            suggests lighting, environment or genetics need attention.
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Per-harvest efficiency</CardTitle>
          <CardDescription>
            Grams of dry yield per watt of installed light. Higher = better.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartRows.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No harvests with linked tent and active lights to compute
              efficiency yet.
            </div>
          ) : (
            <>
              <div className="h-[260px] mb-4">
                <Bar
                  data={{
                    labels: chartRows.map((r) =>
                      r.cycleName.length > 20
                        ? r.cycleName.slice(0, 18) + "…"
                        : r.cycleName
                    ),
                    datasets: [
                      {
                        label: "g / W",
                        data: chartRows.map((r) => r.yieldPerWatt ?? 0),
                        backgroundColor: chartRows.map((r) =>
                          (r.yieldPerWatt ?? 0) >= 1
                            ? PALETTE[0]
                            : (r.yieldPerWatt ?? 0) >= 0.5
                            ? PALETTE[1]
                            : PALETTE[3]
                        ),
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        ticks: { font: { size: 10 } },
                        title: {
                          display: true,
                          text: "grams / watt",
                          font: { size: 10 },
                        },
                      },
                      x: { ticks: { font: { size: 9 } } },
                    },
                  }}
                />
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground sticky top-0 bg-card">
                    <tr>
                      <th className="text-left p-2">Cycle</th>
                      <th className="text-left p-2">Strain</th>
                      <th className="text-left p-2">Tent</th>
                      <th className="text-left p-2">Harvested</th>
                      <th className="text-right p-2">Dry</th>
                      <th className="text-right p-2">Watts</th>
                      <th className="text-right p-2">g/W</th>
                      <th className="text-right p-2">g/kWh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartRows.map((r) => (
                      <tr key={r.harvestId} className="border-b border-border">
                        <td className="p-2 font-medium truncate max-w-[160px]">
                          {r.cycleName}
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">
                          {r.strainName ?? "—"}
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">
                          {r.tentName ?? "—"}
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">
                          {formatDate(r.harvestDate)}
                        </td>
                        <td className="text-right p-2">
                          {formatGrams(r.dryGrams)}
                        </td>
                        <td className="text-right p-2">
                          {r.totalWatts ? `${r.totalWatts} W` : "—"}
                        </td>
                        <td className="text-right p-2 font-semibold text-primary">
                          {r.yieldPerWatt != null
                            ? formatNumber(r.yieldPerWatt, 2)
                            : "—"}
                        </td>
                        <td className="text-right p-2 text-muted-foreground">
                          {r.gramsPerKwh != null
                            ? formatNumber(r.gramsPerKwh, 2)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "destructive";
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-xl font-bold mt-1 ${
          tone === "primary"
            ? "text-primary"
            : tone === "destructive"
            ? "text-destructive"
            : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-sm text-muted-foreground text-center py-8 h-full flex items-center justify-center">
      No data for the selected filter.
    </div>
  );
}
