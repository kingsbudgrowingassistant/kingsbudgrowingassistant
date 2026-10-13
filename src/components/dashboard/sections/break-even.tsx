"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-context";
import {
  computeDashboardKpis,
  computeDirectorSplits,
} from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/format";
import { SectionHeader } from "../section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Receipt,
  DollarSign,
  Users,
} from "lucide-react";
import { DirectorDoughnut } from "../charts";

export function BreakEvenSection() {
  const data = useData();
  const currency = data.settings?.currency ?? "ZAR";

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

  // Per-tent overhead breakdown
  const perTent = useMemo(() => {
    return data.tents.map((t) => {
      const tentLights = data.lights.filter(
        (l) => l.tent_id === t.id && l.active
      );
      const kwh = tentLights.reduce(
        (s, l) =>
          s +
          (l.wattage * l.quantity * l.hours_per_day * 30) / 1000,
        0
      );
      const cost =
        kwh * (data.settings?.electricity_tariff ?? 3.5);
      const tentExpenses = data.expenses
        .filter((e) => e.tent_id === t.id)
        .reduce((s, e) => s + Number(e.amount), 0);
      const tentHarvests = data.harvests
        .filter((h) => h.tent_id === t.id)
        .reduce((s, h) => s + Number(h.dry_weight), 0);
      return {
        tent: t,
        kwh,
        electricityCost: cost,
        expenses: tentExpenses,
        totalOverhead: cost + tentExpenses,
        harvestGrams: tentHarvests,
      };
    });
  }, [data.tents, data.lights, data.expenses, data.harvests, data.settings?.electricity_tariff]);

  const monthlyOverhead = kpis.monthlyOverheads;
  const avgPrice = kpis.averagePricePerGram;
  const breakEvenGrams = kpis.breakEvenGrams;
  const actualSoldThisMonth = useMemo(() => {
    const now = new Date();
    return data.sales
      .filter((s) => {
        const d = new Date(s.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, s) => sum + Number(s.quantity), 0);
  }, [data.sales]);
  const surplusGrams = actualSoldThisMonth - breakEvenGrams;
  const isProfitable = surplusGrams >= 0;

  return (
    <div>
      <SectionHeader
        title="Break-Even Analysis"
        description="Live break-even calculations — the moment you add a light, expense, or sale, the dashboard recomputes the grams needed to cover monthly overheads."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Monthly overheads
            </div>
            <div className="text-xl font-bold mt-1">
              {formatCurrency(monthlyOverhead, currency)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              electricity + fixed + expenses
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Avg price / g
            </div>
            <div className="text-xl font-bold mt-1">
              {formatCurrency(avgPrice, currency)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              from all-time sales
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Break-even target
            </div>
            <div className="text-xl font-bold mt-1 text-primary">
              {formatNumber(breakEvenGrams)} g
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              grams to sell this month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div
              className={`text-[11px] uppercase tracking-wide ${
                isProfitable ? "text-primary" : "text-destructive"
              }`}
            >
              {isProfitable ? "Surplus (above break-even)" : "Shortfall"}
            </div>
            <div
              className={`text-xl font-bold mt-1 ${
                isProfitable ? "text-primary" : "text-destructive"
              }`}
            >
              {surplusGrams >= 0 ? "+" : ""}
              {formatNumber(Math.abs(surplusGrams))} g
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              sold {formatNumber(actualSoldThisMonth)} g this month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> Monthly overhead breakdown
            </CardTitle>
            <CardDescription>
              Where the {formatCurrency(monthlyOverhead, currency)} goes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Electricity (variable)"
              value={formatCurrency(
                kpis.totalMonthlyElectricityCost,
                currency
              )}
              sub={`${kpis.totalMonthlyKwh.toFixed(0)} kWh × ${formatCurrency(
                data.settings?.electricity_tariff ?? 3.5,
                currency
              )}/kWh`}
            />
            <Row
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Electricity (fixed)"
              value={formatCurrency(kpis.monthlyFixedCharge, currency)}
              sub="monthly service charge"
            />
            <Row
              icon={<Receipt className="h-4 w-4 text-amber-600" />}
              label="Other expenses"
              value={formatCurrency(kpis.monthlyExpenses, currency)}
              sub="spent this month"
            />
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="font-medium">Total monthly overheads</span>
              <span className="font-bold text-primary">
                {formatCurrency(monthlyOverhead, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Company & director split
            </CardTitle>
            <CardDescription>
              Profit pool distribution based on your settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Gross profit (all-time)
                </div>
                <div className="text-xl font-bold mt-1">
                  {formatCurrency(kpis.grossProfit, currency)}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Company ({data.settings?.company_percentage ?? 30}%):</span>
                    <span className="font-medium">
                      {formatCurrency(kpis.companyShare, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Directors pool:</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(kpis.directorShare, currency)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[180px]">
                <DirectorDoughnut
                  data={directorSplits.map((d) => ({
                    name: d.director.name,
                    amount: d.amount,
                    percentage: d.effectivePercentage,
                  }))}
                  currency={currency}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Per-tent profitability
          </CardTitle>
          <CardDescription>
            Electricity, expenses and harvest yield grouped by tent.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {perTent.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Add tents and lights to see per-tent profitability.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                    <th className="text-left p-3">Tent</th>
                    <th className="text-right p-3">kWh</th>
                    <th className="text-right p-3">Electricity</th>
                    <th className="text-right p-3">Expenses</th>
                    <th className="text-right p-3">Total overhead</th>
                    <th className="text-right p-3">Harvest (dry)</th>
                    <th className="text-right p-3">g/W</th>
                  </tr>
                </thead>
                <tbody>
                  {perTent.map((row) => {
                    const watts = data.lights
                      .filter((l) => l.tent_id === row.tent.id && l.active)
                      .reduce((s, l) => s + l.wattage * l.quantity, 0);
                    const ypw = watts > 0 ? row.harvestGrams / watts : null;
                    return (
                    <tr key={row.tent.id} className="border-b border-border">
                      <td className="p-3 font-medium">{row.tent.name}</td>
                      <td className="text-right p-3">
                        {row.kwh.toFixed(0)}
                      </td>
                      <td className="text-right p-3">
                        {formatCurrency(row.electricityCost, currency)}
                      </td>
                      <td className="text-right p-3">
                        {formatCurrency(row.expenses, currency)}
                      </td>
                      <td className="text-right p-3 font-semibold">
                        {formatCurrency(row.totalOverhead, currency)}
                      </td>
                      <td className="text-right p-3 text-primary font-medium">
                        {formatNumber(row.harvestGrams)} g
                      </td>
                      <td className="text-right p-3 text-primary font-medium">
                        {ypw != null ? formatNumber(ypw, 2) : "—"}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-[11px] text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

void TrendingDown;
