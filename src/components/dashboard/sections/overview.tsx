"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { computeDashboardKpis, computeDirectorSplits } from "@/lib/calculations";
import { formatCurrency, formatGrams, formatNumber } from "@/lib/format";
import { SectionHeader } from "../section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tent as TentIcon,
  Lightbulb,
  Zap,
  Receipt,
  Sprout,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  Calendar,
} from "lucide-react";
import { RevenueExpenseChart, HarvestChart } from "../charts";
import { useRouter, type PageKey } from "@/lib/router";
import { Button } from "@/components/ui/button";

export function OverviewSection() {
  const data = useData();
  const { profile } = useAuth();
  const router = useRouter();

  const kpis = computeDashboardKpis({
    tents: data.tents,
    lights: data.lights,
    electricity: data.electricity,
    expenses: data.expenses,
    harvests: data.harvests,
    sales: data.sales,
    settings: data.settings,
    directors: data.directors,
  });

  const directorSplits = computeDirectorSplits(
    data.directors,
    kpis.directorShare
  );

  const currency = data.settings?.currency ?? "ZAR";

  const cards = [
    {
      label: "Active tents",
      value: formatNumber(kpis.activeTents),
      sub: `${kpis.totalTents} total`,
      icon: TentIcon,
      tone: "primary" as const,
    },
    {
      label: "Active lights",
      value: formatNumber(kpis.activeLights),
      sub: `${kpis.totalLights} total`,
      icon: Lightbulb,
      tone: "primary" as const,
    },
    {
      label: "Monthly kWh",
      value: formatNumber(kpis.totalMonthlyKwh),
      sub: "from all active lights",
      icon: Zap,
      tone: "amber" as const,
    },
    {
      label: "Electricity / month",
      value: formatCurrency(kpis.totalMonthlyElectricityCost, currency),
      sub: `+ ${formatCurrency(kpis.monthlyFixedCharge, currency)} fixed`,
      icon: Zap,
      tone: "amber" as const,
    },
    {
      label: "Monthly overheads",
      value: formatCurrency(kpis.monthlyOverheads, currency),
      sub: `incl. ${formatCurrency(kpis.monthlyExpenses, currency)} expenses`,
      icon: Receipt,
      tone: "amber" as const,
    },
    {
      label: "Total harvest",
      value: formatGrams(kpis.totalHarvestsDry),
      sub: `${formatGrams(kpis.totalHarvestsWet)} wet`,
      icon: Sprout,
      tone: "primary" as const,
    },
    {
      label: "Total revenue",
      value: formatCurrency(kpis.totalRevenue, currency),
      sub: `${formatGrams(kpis.totalSalesGrams)} sold`,
      icon: DollarSign,
      tone: "primary" as const,
    },
    {
      label: "Gross profit / loss",
      value: formatCurrency(kpis.grossProfit, currency),
      sub: `${kpis.grossProfit >= 0 ? "positive" : "negative"} balance`,
      icon: kpis.grossProfit >= 0 ? TrendingUp : TrendingDown,
      tone: kpis.grossProfit >= 0 ? ("primary" as const) : ("destructive" as const),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Welcome back, ${profile?.full_name?.split(" ")[0] ?? "grower"}`}
        description="Live KPIs across your cultivation business — recalculated the moment data changes on any device."
        extra={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.navigate("dashboard:reports" as PageKey)}
          >
            View reports
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="text-xl font-bold mt-1 truncate">
                    {c.value}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {c.sub}
                  </div>
                </div>
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    c.tone === "primary"
                      ? "bg-primary/10 text-primary"
                      : c.tone === "amber"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Revenue vs.
              Expenses
            </CardTitle>
            <CardDescription>
              Monthly breakdown across all time, synced across devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueExpenseChart
              sales={data.sales}
              expenses={data.expenses}
              currency={currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary" /> Harvest yield
            </CardTitle>
            <CardDescription>Wet vs dry weight over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <HarvestChart harvests={data.harvests} />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> Break-even target
            </CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                Monthly overheads
              </span>
              <span className="font-semibold">
                {formatCurrency(kpis.breakEvenCurrency, currency)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                Avg price / g
              </span>
              <span className="font-semibold">
                {formatCurrency(kpis.averagePricePerGram, currency)}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-border">
              <span className="text-sm font-medium">Grams to break even</span>
              <span className="text-lg font-bold text-primary">
                {formatNumber(kpis.breakEvenGrams)} g
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                router.navigate("dashboard:break-even" as PageKey)
              }
            >
              Open Break-Even analysis
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Director split
            </CardTitle>
            <CardDescription>
              Net profit pool: {formatCurrency(kpis.directorShare, currency)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {directorSplits.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No directors configured yet.{" "}
                <button
                  onClick={() =>
                    router.navigate("dashboard:directors" as PageKey)
                  }
                  className="text-primary hover:underline"
                >
                  Add directors →
                </button>
              </div>
            )}
            {directorSplits.map(({ director, amount, effectivePercentage }) => (
              <div
                key={director.id}
                className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{director.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {effectivePercentage.toFixed(1)}% effective
                  </div>
                </div>
                <div className="font-semibold text-primary">
                  {formatCurrency(amount, currency)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Recent activity
            </CardTitle>
            <CardDescription>Latest 5 records across the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentActivity() {
  const data = useData();
  const items: { date: string; label: string; sub: string }[] = [
    ...data.sales.map((s) => ({
      date: s.date,
      label: `Sale: ${s.product}`,
      sub: `${formatCurrency(Number(s.revenue), data.settings?.currency)}`,
    })),
    ...data.expenses.map((e) => ({
      date: e.date,
      label: `Expense: ${e.category}`,
      sub: `${formatCurrency(Number(e.amount), data.settings?.currency)}`,
    })),
    ...data.harvests.map((h) => ({
      date: h.harvest_date ?? h.created_at,
      label: `Harvest: ${h.cycle_name}`,
      sub: `${formatGrams(Number(h.dry_weight))} dry`,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No activity yet. Start by adding tents, lights or harvests.
      </div>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex items-center justify-between py-2 border-b border-border last:border-0"
        >
          <div className="min-w-0">
            <div className="font-medium truncate">{it.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(it.date).toLocaleDateString("en-ZA")}
            </div>
          </div>
          <div className="font-semibold text-primary shrink-0">{it.sub}</div>
        </li>
      ))}
    </ul>
  );
}
