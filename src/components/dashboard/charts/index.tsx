"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { useMemo } from "react";

// Re-export so other components can use the wrapped chart.js components
// without re-registering the Chart.js modules.
export { Line, Bar, Doughnut };

// Standardised palette (Chart.js canvas doesn't reliably parse OKLCH).
const COLORS = {
  primary: "#16a34a",       // green
  primarySoft: "rgba(22, 163, 74, 0.15)",
  amber: "#d97706",
  amberSoft: "rgba(217, 119, 6, 0.15)",
  red: "#dc2626",
  redSoft: "rgba(220, 38, 38, 0.15)",
  blue: "#3b82f6",
  blueSoft: "rgba(59, 130, 246, 0.15)",
  purple: "#9333ea",
  purpleSoft: "rgba(147, 51, 234, 0.15)",
  teal: "#0d9488",
  tealSoft: "rgba(13, 148, 136, 0.15)",
};
const PALETTE = [
  COLORS.primary, COLORS.amber, COLORS.blue,
  COLORS.red, COLORS.purple, COLORS.teal,
];

import { monthlySeries } from "@/lib/calculations";
import { formatCurrency, formatMonthLabel, formatGrams } from "@/lib/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface RevenueExpenseChartProps {
  sales: { date: string; revenue: number }[];
  expenses: { date: string; amount: number }[];
  currency: string;
}

export function RevenueExpenseChart({
  sales,
  expenses,
  currency,
}: RevenueExpenseChartProps) {
  const revenueSeries = useMemo(
    () => monthlySeries(sales.map((s) => ({ date: s.date, value: Number(s.revenue) }))),
    [sales]
  );
  const expenseSeries = useMemo(
    () => monthlySeries(expenses.map((e) => ({ date: e.date, value: Number(e.amount) }))),
    [expenses]
  );

  const allMonths = Array.from(
    new Set([
      ...revenueSeries.map((r) => r.month),
      ...expenseSeries.map((r) => r.month),
    ])
  ).sort();

  if (allMonths.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No sales or expenses recorded yet.
      </div>
    );
  }

  const data = {
    labels: allMonths.map(formatMonthLabel),
    datasets: [
      {
        label: "Revenue",
        data: allMonths.map(
          (m) => revenueSeries.find((r) => r.month === m)?.value ?? 0
        ),
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft,
        fill: true,
        tension: 0.35,
      },
      {
        label: "Expenses",
        data: allMonths.map(
          (m) => expenseSeries.find((r) => r.month === m)?.value ?? 0
        ),
        borderColor: COLORS.red,
        backgroundColor: COLORS.redSoft,
        fill: true,
        tension: 0.35,
      },
    ],
  };

  return (
    <Line
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top" as const,
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${formatCurrency(
                  Number(ctx.parsed.y),
                  currency
                )}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              font: { size: 10 },
              callback: (v) => formatCurrency(Number(v), currency),
            },
          },
          x: { ticks: { font: { size: 10 } } },
        },
      }}
    />
  );
}

interface HarvestChartProps {
  harvests: { harvest_date: string | null; created_at: string; wet_weight: number; dry_weight: number }[];
}

export function HarvestChart({ harvests }: HarvestChartProps) {
  const monthly = useMemo(() => {
    const buckets: Record<string, { wet: number; dry: number }> = {};
    for (const h of harvests) {
      const d = new Date(h.harvest_date ?? h.created_at);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = buckets[key] ?? { wet: 0, dry: 0 };
      buckets[key].wet += Number(h.wet_weight);
      buckets[key].dry += Number(h.dry_weight);
    }
    return Object.entries(buckets)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, v]) => ({ month, ...v }));
  }, [harvests]);

  if (monthly.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No harvests recorded yet.
      </div>
    );
  }

  const data = {
    labels: monthly.map((m) => formatMonthLabel(m.month)),
    datasets: [
      {
        label: "Wet (g)",
        data: monthly.map((m) => m.wet),
        backgroundColor: COLORS.amber,
      },
      {
        label: "Dry (g)",
        data: monthly.map((m) => m.dry),
        backgroundColor: COLORS.primary,
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top" as const,
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${formatGrams(Number(ctx.parsed.y))}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              font: { size: 10 },
              callback: (v) => `${v} g`,
            },
          },
          x: { ticks: { font: { size: 10 } } },
        },
      }}
    />
  );
}

interface DirectorDoughnutProps {
  data: { name: string; amount: number; percentage: number }[];
  currency: string;
}

export function DirectorDoughnut({ data, currency }: DirectorDoughnutProps) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No directors to display.
      </div>
    );
  }
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.amount),
        backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
  return (
    <Doughnut
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: ${formatCurrency(Number(ctx.parsed), currency)}`,
            },
          },
        },
      }}
    />
  );
}

interface ExpensesByCategoryProps {
  expenses: { category: string; amount: number }[];
  currency: string;
}

export function ExpensesByCategoryChart({
  expenses,
  currency,
}: ExpensesByCategoryProps) {
  const buckets: Record<string, number> = {};
  for (const e of expenses) {
    buckets[e.category] = (buckets[e.category] ?? 0) + Number(e.amount);
  }
  const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No expenses recorded yet.
      </div>
    );
  }
  const data = {
    labels: entries.map(([k]) => k),
    datasets: [
      {
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map((_, i) => PALETTE[i % PALETTE.length]),
      },
    ],
  };
  return (
    <Doughnut
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: ${formatCurrency(Number(ctx.parsed), currency)}`,
            },
          },
        },
      }}
    />
  );
}
