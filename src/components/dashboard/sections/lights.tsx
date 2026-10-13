"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { computeLightKpi } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/format";
import { SectionHeader } from "../section-header";
import { ConfirmDelete, EmptyState, LoadingState } from "../shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Calendar,
} from "lucide-react";
import { todayISODate } from "@/lib/format";
import type { Light } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  tent_id: string;
  name: string;
  wattage: string;
  quantity: string;
  hours_per_day: string;
  active: boolean;
  start_date: string;
  end_date: string;
}

export function LightsSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      tent_id: data.tents[0]?.id ?? "",
      name: "",
      wattage: "600",
      quantity: "1",
      hours_per_day: "18",
      active: true,
      start_date: todayISODate(),
      end_date: "",
    };
  }

  const tariff = data.settings?.electricity_tariff ?? 3.5;
  const currency = data.settings?.currency ?? "ZAR";

  const lightKpis = useMemo(
    () => data.lights.map((l) => computeLightKpi(l, tariff)),
    [data.lights, tariff]
  );

  const totals = useMemo(
    () => ({
      monthlyKwh: lightKpis.reduce((s, k) => s + k.monthlyKwh, 0),
      monthlyCost: lightKpis.reduce((s, k) => s + k.monthlyCost, 0),
      yearlyKwh: lightKpis.reduce((s, k) => s + k.yearlyKwh, 0),
    }),
    [lightKpis]
  );

  const openCreate = () => {
    if (data.tents.length === 0) {
      toast.error("Add a tent first before adding lights.");
      return;
    }
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (light: Light) => {
    setForm({
      id: light.id,
      tent_id: light.tent_id,
      name: light.name,
      wattage: String(light.wattage),
      quantity: String(light.quantity),
      hours_per_day: String(light.hours_per_day),
      active: light.active,
      start_date: light.start_date ?? "",
      end_date: light.end_date ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tent_id) {
      toast.error("Tent is required.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Light name is required.");
      return;
    }
    if (Number(form.wattage) <= 0) {
      toast.error("Wattage must be greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertLight({
        id: form.id,
        tent_id: form.tent_id,
        name: form.name.trim(),
        wattage: Number(form.wattage),
        quantity: Number(form.quantity),
        hours_per_day: Number(form.hours_per_day),
        active: form.active,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      toast.success(form.id ? "Light updated." : "Light added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save light.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteLight(deleteId);
      toast.success("Light deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete light.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Lights"
        description="Every light contributes to monthly kWh and electricity cost. Formula: wattage × quantity × hours_per_day × 30 ÷ 1000 = monthly kWh."
        actionLabel="Add light"
        onAction={openCreate}
      />

      {data.lights.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Monthly kWh
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatNumber(totals.monthlyKwh, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Monthly cost
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(totals.monthlyCost, currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Yearly kWh
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatNumber(totals.yearlyKwh, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {data.loading ? (
        <LoadingState label="Loading lights…" />
      ) : data.lights.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="h-6 w-6" />}
          title="No lights yet"
          description="Add lights against a tent to track wattage, hours per day, and the resulting monthly kWh and Rand cost."
          actionLabel="Add light"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.lights.length} light{data.lights.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tent</TableHead>
                    <TableHead className="text-right">W</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Hrs/day</TableHead>
                    <TableHead className="text-right">kWh/mo</TableHead>
                    <TableHead className="text-right">Cost/mo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lights.map((l) => {
                    const kpi = computeLightKpi(l, tariff);
                    const tent = data.tents.find((t) => t.id === l.tent_id);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {tent?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">{l.wattage}</TableCell>
                        <TableCell className="text-right">{l.quantity}</TableCell>
                        <TableCell className="text-right">
                          {l.hours_per_day}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(kpi.monthlyKwh, 1)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCurrency(kpi.monthlyCost, currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={l.active ? "default" : "secondary"}
                          >
                            {l.active ? "On" : "Off"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(l)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(l.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit light" : "Add light"}</DialogTitle>
            <DialogDescription>
              Wattage, quantity and hours/day drive the monthly electricity
              calculation in the dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tent_id">Tent *</Label>
              <Select
                value={form.tent_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, tent_id: v }))
                }
              >
                <SelectTrigger id="tent_id">
                  <SelectValue placeholder="Select a tent" />
                </SelectTrigger>
                <SelectContent>
                  {data.tents.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="600W HPS"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wattage">Wattage (W) *</Label>
                <Input
                  id="wattage"
                  type="number"
                  required
                  min="1"
                  value={form.wattage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, wattage: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  required
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_per_day">Hours/day *</Label>
                <Input
                  id="hours_per_day"
                  type="number"
                  required
                  min="0"
                  max="24"
                  step="0.5"
                  value={form.hours_per_day}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hours_per_day: e.target.value }))
                  }
                />
              </div>
            </div>

            {form.wattage && form.quantity && form.hours_per_day && (
              <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>
                    Daily kWh:{" "}
                    <strong>
                      {formatNumber(
                        (Number(form.wattage) *
                          Number(form.quantity) *
                          Number(form.hours_per_day)) /
                          1000,
                        2
                      )}
                    </strong>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>
                    Monthly:{" "}
                    <strong>
                      {formatNumber(
                        (Number(form.wattage) *
                          Number(form.quantity) *
                          Number(form.hours_per_day) *
                          30) /
                          1000,
                        1
                      )}{" "}
                      kWh
                    </strong>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>
                    Cost:{" "}
                    <strong>
                      {formatCurrency(
                        (Number(form.wattage) *
                          Number(form.quantity) *
                          Number(form.hours_per_day) *
                          30) /
                          1000 *
                          tariff,
                        currency
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="active" className="text-sm font-normal">
                  Active (counted in electricity calculations)
                </Label>
              </div>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, active: v === true }))
                }
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
                  : "Add light"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this light?"
        description="The light will be removed from your electricity calculations immediately."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
