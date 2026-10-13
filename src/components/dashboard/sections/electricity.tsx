"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { SectionHeader } from "../section-header";
import { ConfirmDelete, EmptyState, LoadingState } from "../shared";
import { computeLightKpi } from "@/lib/calculations";
import { formatCurrency, formatNumber, currentMonthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, Plus, Pencil, Trash2 } from "lucide-react";
import type { Electricity } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  month: string;
  tariff: string;
  fixed_charge: string;
  notes: string;
}

export function ElectricitySection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      month: currentMonthKey(),
      tariff: String(data.settings?.electricity_tariff ?? 3.5),
      fixed_charge: "0",
      notes: "",
    };
  }

  const currency = data.settings?.currency ?? "ZAR";

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: Electricity) => {
    setForm({
      id: rec.id,
      month: rec.month,
      tariff: String(rec.tariff),
      fixed_charge: String(rec.fixed_charge),
      notes: rec.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.month) {
      toast.error("Month is required.");
      return;
    }
    if (Number(form.tariff) < 0) {
      toast.error("Tariff must be 0 or greater.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertElectricity({
        id: form.id,
        month: form.month,
        tariff: Number(form.tariff),
        fixed_charge: Number(form.fixed_charge),
        notes: form.notes.trim() || null,
      });
      toast.success(form.id ? "Tariff updated." : "Tariff added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save tariff.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteElectricity(deleteId);
      toast.success("Tariff deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete tariff.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Electricity"
        description="Track monthly tariff (per kWh) and fixed monthly service charges. The latest month is used for live dashboard calculations."
        actionLabel="Add tariff"
        onAction={openCreate}
      />

      {data.loading ? (
        <LoadingState label="Loading electricity records…" />
      ) : data.electricity.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-6 w-6" />}
          title="No electricity records yet"
          description="Add your monthly tariff and fixed charges to enable accurate cost calculations across the dashboard."
          actionLabel="Add tariff"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.electricity.length} month
              {data.electricity.length !== 1 ? "s" : ""} of tariffs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Tariff / kWh</TableHead>
                    <TableHead className="text-right">Fixed charge</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.electricity.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono">{e.month}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(e.tariff), currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(e.fixed_charge), currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[280px] truncate">
                        {e.notes ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(e.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <PerTentElectricityBreakdown />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit tariff" : "Add tariff"}
            </DialogTitle>
            <DialogDescription>
              Tariff (per kWh) and fixed monthly charge — typically from your
              municipality or Eskom bill.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <Input
                id="month"
                type="month"
                required
                value={form.month}
                onChange={(e) =>
                  setForm((f) => ({ ...f, month: e.target.value }))
                }
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tariff">Tariff / kWh (ZAR) *</Label>
                <Input
                  id="tariff"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.tariff}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tariff: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fixed_charge">Fixed monthly charge</Label>
                <Input
                  id="fixed_charge"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.fixed_charge}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fixed_charge: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Account number, season, or any context."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving…"
                  : form.id
                  ? "Save changes"
                  : "Add tariff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this tariff?"
        description="The latest month in the remaining list will be used for cost calculations."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-tent electricity breakdown — shows kWh and Rand cost per tent per
// day, per month (30-day) and per year (365-day). Derived from the active
// lights linked to each tent.
// ---------------------------------------------------------------------------
function PerTentElectricityBreakdown() {
  const data = useData();
  const currency = data.settings?.currency ?? "ZAR";
  const tariff = data.settings?.electricity_tariff ?? 3.5;

  const rows = useMemo(() => {
    return data.tents.map((tent) => {
      const activeLights = data.lights.filter(
        (l) => l.tent_id === tent.id && l.active
      );
      const lightKpis = activeLights.map((l) => computeLightKpi(l, tariff));
      const dailyKwh = lightKpis.reduce((s, k) => s + k.dailyKwh, 0);
      const monthlyKwh = lightKpis.reduce((s, k) => s + k.monthlyKwh, 0);
      const yearlyKwh = lightKpis.reduce((s, k) => s + k.yearlyKwh, 0);
      return {
        tent,
        lightCount: activeLights.length,
        totalWatts: activeLights.reduce((s, l) => s + l.wattage * l.quantity, 0),
        dailyKwh,
        monthlyKwh,
        yearlyKwh,
        dailyCost: dailyKwh * tariff,
        monthlyCost: monthlyKwh * tariff,
        yearlyCost: yearlyKwh * tariff,
      };
    });
  }, [data.tents, data.lights, tariff]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        dailyKwh: acc.dailyKwh + r.dailyKwh,
        monthlyKwh: acc.monthlyKwh + r.monthlyKwh,
        yearlyKwh: acc.yearlyKwh + r.yearlyKwh,
        dailyCost: acc.dailyCost + r.dailyCost,
        monthlyCost: acc.monthlyCost + r.monthlyCost,
        yearlyCost: acc.yearlyCost + r.yearlyCost,
      }),
      { dailyKwh: 0, monthlyKwh: 0, yearlyKwh: 0, dailyCost: 0, monthlyCost: 0, yearlyCost: 0 }
    );
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Electricity usage per tent
        </CardTitle>
        <CardDescription>
          Daily, monthly (30-day) and yearly (365-day) kWh and Rand cost
          derived from active lights linked to each tent. Tariff used:{" "}
          {formatCurrency(tariff, currency)}/kWh.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Add tents and lights to see the per-tent electricity breakdown.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tent</TableHead>
                  <TableHead className="text-right">Lights</TableHead>
                  <TableHead className="text-right">Watts</TableHead>
                  <TableHead className="text-right">kWh/day</TableHead>
                  <TableHead className="text-right">Cost/day</TableHead>
                  <TableHead className="text-right">kWh/mo</TableHead>
                  <TableHead className="text-right">Cost/mo</TableHead>
                  <TableHead className="text-right">kWh/yr</TableHead>
                  <TableHead className="text-right">Cost/yr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.tent.id}>
                    <TableCell className="font-medium">{r.tent.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {r.lightCount}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {r.totalWatts} W
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(r.dailyKwh, 2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(r.dailyCost, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(r.monthlyKwh, 1)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(r.monthlyCost, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(r.yearlyKwh, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(r.yearlyCost, currency)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right">
                    {formatNumber(totals.dailyKwh, 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.dailyCost, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(totals.monthlyKwh, 1)}
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    {formatCurrency(totals.monthlyCost, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(totals.yearlyKwh, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.yearlyCost, currency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
