"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { SectionHeader } from "../section-header";
import { ConfirmDelete, EmptyState, LoadingState } from "../shared";
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
import { Badge } from "@/components/ui/badge";
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
import { Beaker, Plus, Pencil, Trash2, Droplets } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { NutrientLog } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  logged_at: string;        // datetime-local format
  tent_id: string;
  strain_id: string;
  season_id: string;
  nutrient_mix: string;
  amount_ml: string;
  water_ph: string;
  water_ec: string;
  runoff_ph: string;
  runoff_ec: string;
  notes: string;
}

function nowDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return nowDatetimeLocal();
  const d = new Date(iso);
  if (isNaN(d.getTime())) return nowDatetimeLocal();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fromDatetimeLocal(local: string): string {
  if (!local) return new Date().toISOString();
  return new Date(local).toISOString();
}

export function NutrientLogsSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      logged_at: nowDatetimeLocal(),
      tent_id: data.tents[0]?.id ?? "",
      strain_id: data.strains[0]?.id ?? "",
      season_id: data.seasons[0]?.id ?? "",
      nutrient_mix: "",
      amount_ml: "",
      water_ph: "",
      water_ec: "",
      runoff_ph: "",
      runoff_ec: "",
      notes: "",
    };
  }

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: NutrientLog) => {
    setForm({
      id: rec.id,
      logged_at: toDatetimeLocal(rec.logged_at),
      tent_id: rec.tent_id ?? "",
      strain_id: rec.strain_id ?? "",
      season_id: rec.season_id ?? "",
      nutrient_mix: rec.nutrient_mix ?? "",
      amount_ml: rec.amount_ml != null ? String(rec.amount_ml) : "",
      water_ph: rec.water_ph != null ? String(rec.water_ph) : "",
      water_ec: rec.water_ec != null ? String(rec.water_ec) : "",
      runoff_ph: rec.runoff_ph != null ? String(rec.runoff_ph) : "",
      runoff_ec: rec.runoff_ec != null ? String(rec.runoff_ec) : "",
      notes: rec.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await data.upsertNutrientLog({
        id: form.id,
        logged_at: fromDatetimeLocal(form.logged_at),
        tent_id: form.tent_id || null,
        strain_id: form.strain_id || null,
        season_id: form.season_id || null,
        nutrient_mix: form.nutrient_mix.trim() || null,
        amount_ml: form.amount_ml ? Number(form.amount_ml) : null,
        water_ph: form.water_ph ? Number(form.water_ph) : null,
        water_ec: form.water_ec ? Number(form.water_ec) : null,
        runoff_ph: form.runoff_ph ? Number(form.runoff_ph) : null,
        runoff_ec: form.runoff_ec ? Number(form.runoff_ec) : null,
        notes: form.notes.trim() || null,
      });
      toast.success(form.id ? "Feeding log updated." : "Feeding log added.");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save feeding log.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteNutrientLog(deleteId);
      toast.success("Feeding log deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete feeding log.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Nutrient Logs"
        description="Every feeding: what you fed, how much, the input pH + EC, and the runoff pH + EC. Comparing input vs runoff tells you whether your root zone is accumulating or locking out nutrients."
        actionLabel="Add feeding log"
        onAction={openCreate}
      />

      {data.loading ? (
        <LoadingState label="Loading feeding logs…" />
      ) : data.nutrientLogs.length === 0 ? (
        <EmptyState
          icon={<Beaker className="h-6 w-6" />}
          title="No feeding logs yet"
          description="Log your first feeding — nutrient mix, amount, input pH/EC and runoff pH/EC. Over time you'll see patterns in runoff drift that signal lockout or over-feed."
          actionLabel="Add feeding log"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.nutrientLogs.length} feeding
              {data.nutrientLogs.length !== 1 ? "s" : ""} logged
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Tent</TableHead>
                    <TableHead>Mix</TableHead>
                    <TableHead className="text-right">mL</TableHead>
                    <TableHead className="text-right">In pH</TableHead>
                    <TableHead className="text-right">In EC</TableHead>
                    <TableHead className="text-right">Run pH</TableHead>
                    <TableHead className="text-right">Run EC</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.nutrientLogs.map((n) => {
                    const tent = data.tents.find((t) => t.id === n.tent_id);
                    return (
                      <TableRow key={n.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(n.logged_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tent?.name ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[240px] truncate">
                          {n.nutrient_mix ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {n.amount_ml != null ? Number(n.amount_ml).toLocaleString() : "—"}
                        </TableCell>
                        <PhCell value={n.water_ph} idealMin={5.8} idealMax={6.5} label="pH" />
                        <EcCell value={n.water_ec} label="EC" />
                        <PhCell value={n.runoff_ph} idealMin={5.8} idealMax={6.5} label="pH" />
                        <EcCell value={n.runoff_ec} label="EC" />
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(n)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(n.id)}
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
            <DialogTitle>
              {form.id ? "Edit feeding log" : "Add feeding log"}
            </DialogTitle>
            <DialogDescription>
              Tip: aim for input pH 5.8–6.5 and input EC within ±0.3 of your
              target. Runoff pH should drift no more than ±0.5 from input; a
              higher EC in runoff than input indicates salt build-up —
              schedule a flush.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logged_at">When *</Label>
                <Input
                  id="logged_at"
                  type="datetime-local"
                  required
                  value={form.logged_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, logged_at: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tent_id">Tent</Label>
                <Select
                  value={form.tent_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, tent_id: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger id="tent_id">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {data.tents.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strain_id">Strain</Label>
                <Select
                  value={form.strain_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, strain_id: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger id="strain_id">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {data.strains.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="season_id">Season</Label>
                <Select
                  value={form.season_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, season_id: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger id="season_id">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {data.seasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutrient_mix">Nutrient mix</Label>
              <Input
                id="nutrient_mix"
                value={form.nutrient_mix}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nutrient_mix: e.target.value }))
                }
                placeholder="FloraNova Bloom 2ml/L + CalMag 1ml/L"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount_ml">Amount (mL)</Label>
                <Input
                  id="amount_ml"
                  type="number"
                  step="1"
                  min="0"
                  value={form.amount_ml}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount_ml: e.target.value }))
                  }
                  placeholder="1500"
                />
              </div>
            </div>

            <div className="rounded-md border border-border p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Droplets className="h-4 w-4 text-primary" />
                Input solution (what you watered with)
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="water_ph">Input pH (5.8–6.5 ideal)</Label>
                  <Input
                    id="water_ph"
                    type="number"
                    step="0.05"
                    min="0"
                    max="14"
                    value={form.water_ph}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, water_ph: e.target.value }))
                    }
                    placeholder="6.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water_ec">Input EC (mS/cm)</Label>
                  <Input
                    id="water_ec"
                    type="number"
                    step="0.05"
                    min="0"
                    value={form.water_ec}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, water_ec: e.target.value }))
                    }
                    placeholder="1.8"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Droplets className="h-4 w-4 text-amber-600" />
                Runoff (what came out the bottom)
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="runoff_ph">Runoff pH</Label>
                  <Input
                    id="runoff_ph"
                    type="number"
                    step="0.05"
                    min="0"
                    max="14"
                    value={form.runoff_ph}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, runoff_ph: e.target.value }))
                    }
                    placeholder="6.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="runoff_ec">Runoff EC (mS/cm)</Label>
                  <Input
                    id="runoff_ec"
                    type="number"
                    step="0.05"
                    min="0"
                    value={form.runoff_ec}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, runoff_ec: e.target.value }))
                    }
                    placeholder="2.4"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rule of thumb: if runoff EC is &gt;0.5 higher than input EC,
                salts are building up — flush with plain pH'd water next
                watering. If runoff pH drifts &gt;0.5 from input, the medium
                is buffering incorrectly — consider a repot or a slow
                acid-flush.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Plant response, signs of stress, anything unusual…"
                rows={2}
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
                {submitting ? "Saving…" : form.id ? "Save changes" : "Add log"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this feeding log?"
        description="The record will be permanently removed."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

function PhCell({
  value,
  idealMin,
  idealMax,
  label,
}: {
  value: number | null;
  idealMin: number;
  idealMax: number;
  label: string;
}) {
  if (value == null) {
    return <TableCell className="text-right text-muted-foreground">—</TableCell>;
  }
  const v = Number(value);
  const inRange = v >= idealMin && v <= idealMax;
  return (
    <TableCell className="text-right">
      <span className={inRange ? "text-primary font-medium" : "text-amber-600 font-medium"}>
        {v.toFixed(2)}
      </span>
      {!inRange && (
        <span className="ml-1 text-[10px] text-amber-600">⚠</span>
      )}
      <span className="sr-only">{label}</span>
    </TableCell>
  );
}

function EcCell({ value, label }: { value: number | null; label: string }) {
  if (value == null) {
    return <TableCell className="text-right text-muted-foreground">—</TableCell>;
  }
  const v = Number(value);
  return (
    <TableCell className="text-right">
      <span className="text-foreground/80">{v.toFixed(2)}</span>
      <span className="sr-only">{label}</span>
    </TableCell>
  );
}

void Plus;
