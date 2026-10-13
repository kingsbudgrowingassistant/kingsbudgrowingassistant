"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { Line } from "../charts";
import {
  computeVpd,
  computeVpdAssessment,
  STAGE_RANGES,
} from "@/lib/vpd";
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
import { Progress } from "@/components/ui/progress";
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
import {
  Thermometer,
  Droplets,
  Plus,
  Pencil,
  Trash2,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Info,
  Leaf,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type { EnvironmentLog } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  logged_at: string;
  tent_id: string;
  temp_c: string;
  humidity_pct: string;
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

export function EnvironmentSection() {
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
      temp_c: "24",
      humidity_pct: "55",
      notes: "",
    };
  }

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: EnvironmentLog) => {
    setForm({
      id: rec.id,
      logged_at: toDatetimeLocal(rec.logged_at),
      tent_id: rec.tent_id ?? "",
      temp_c: String(rec.temp_c),
      humidity_pct: String(rec.humidity_pct),
      notes: rec.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.temp_c === "" || form.humidity_pct === "") {
      toast.error("Temperature and humidity are required.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertEnvironmentLog({
        id: form.id,
        logged_at: fromDatetimeLocal(form.logged_at),
        tent_id: form.tent_id || null,
        temp_c: Number(form.temp_c),
        humidity_pct: Number(form.humidity_pct),
        notes: form.notes.trim() || null,
      });
      toast.success(form.id ? "Reading updated." : "Reading logged.");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save reading.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteEnvironmentLog(deleteId);
      toast.success("Reading deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete reading.");
    } finally {
      setDeleting(false);
    }
  };

  // Latest reading per tent — drives the VPD + disease assessment cards.
  const latestPerTent = useMemo(() => {
    const byTent: Record<string, EnvironmentLog> = {};
    for (const log of data.environmentLogs) {
      const tid = log.tent_id ?? "_unassigned";
      const existing = byTent[tid];
      if (!existing || new Date(log.logged_at) > new Date(existing.logged_at)) {
        byTent[tid] = log;
      }
    }
    return Object.entries(byTent).map(([tid, log]) => ({
      tentId: tid,
      tentName:
        tid === "_unassigned"
          ? "Unassigned"
          : data.tents.find((t) => t.id === tid)?.name ?? "—",
      log,
    }));
  }, [data.environmentLogs, data.tents]);

  // Time series for the chart (last 50 readings, chronological).
  const chartData = useMemo(() => {
    const sorted = data.environmentLogs
      .slice()
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
      .slice(-50);
    const labels = sorted.map((l) =>
      new Date(l.logged_at).toLocaleString("en-ZA", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    return {
      labels,
      temps: sorted.map((l) => Number(l.temp_c)),
      humidities: sorted.map((l) => Number(l.humidity_pct)),
      vpds: sorted.map((l) => computeVpd(Number(l.temp_c), Number(l.humidity_pct))),
    };
  }, [data.environmentLogs]);

  const hasReadings = data.environmentLogs.length > 0;

  return (
    <div>
      <SectionHeader
        title="Environment"
        description="Log temperature and humidity per tent. We auto-calculate VPD (vapor pressure deficit) on every reading, assess which growth stage the conditions suit, and warn you about cannabis diseases (bud rot, powdery mildew, etc.) when conditions drift into the danger zone."
        actionLabel="Add reading"
        onAction={openCreate}
      />

      {data.loading ? (
        <LoadingState label="Loading environment logs…" />
      ) : !hasReadings ? (
        <EmptyState
          icon={<Thermometer className="h-6 w-6" />}
          title="No environment readings yet"
          description="Log your first temp + humidity reading. VPD will be auto-computed and you'll see which stage your conditions suit and any disease-risk warnings."
          actionLabel="Add reading"
          onAction={openCreate}
        />
      ) : (
        <>
          {/* Latest reading per tent — VPD + stage + disease warnings */}
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            {latestPerTent.map(({ tentId, tentName, log }) => {
              const assessment = computeVpdAssessment(
                Number(log.temp_c),
                Number(log.humidity_pct)
              );
              return (
                <Card key={tentId}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-primary" />
                        {tentName}
                      </span>
                      <Badge
                        variant={
                          assessment.status === "ok"
                            ? "default"
                            : assessment.status === "watch"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          assessment.status === "ok"
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }
                      >
                        {assessment.status === "ok"
                          ? "Healthy"
                          : assessment.status === "watch"
                          ? "Watch"
                          : "Danger"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Latest reading: {formatDate(log.logged_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Big three numbers */}
                    <div className="grid grid-cols-3 gap-3">
                      <Metric
                        icon={<Thermometer className="h-3.5 w-3.5" />}
                        label="Temp"
                        value={`${Number(log.temp_c).toFixed(1)}°C`}
                        inRange={
                          Number(log.temp_c) >= 20 && Number(log.temp_c) <= 28
                        }
                      />
                      <Metric
                        icon={<Droplets className="h-3.5 w-3.5" />}
                        label="Humidity"
                        value={`${Number(log.humidity_pct).toFixed(0)}%`}
                        inRange={
                          Number(log.humidity_pct) >= 40 &&
                          Number(log.humidity_pct) <= 60
                        }
                      />
                      <Metric
                        icon={<Gauge className="h-3.5 w-3.5" />}
                        label="VPD"
                        value={`${assessment.vpdKpa.toFixed(2)}`}
                        unit="kPa"
                        inRange={
                          assessment.vpdKpa >= 0.8 &&
                          assessment.vpdKpa <= 1.5
                        }
                      />
                    </div>

                    {/* Stage assessment */}
                    <div className="rounded-md bg-muted/40 p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium mb-1">
                        {assessment.stageAssessment.idealForThisStage ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                        Ideal for: {assessment.stageAssessment.label}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {assessment.stageAssessment.reason}
                      </p>
                    </div>

                    {/* Ideal range bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>VPD range for {assessment.idealRange.label}</span>
                        <span>
                          {assessment.idealRange.vpdMin}–{assessment.idealRange.vpdMax} kPa
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          100,
                          (assessment.vpdKpa / assessment.idealRange.vpdMax) * 100
                        )}
                        className="h-2"
                      />
                      <div className="text-[11px] text-muted-foreground">
                        Target {assessment.idealRange.tempMin}–{assessment.idealRange.tempMax}°C, RH {assessment.idealRange.rhMin}–{assessment.idealRange.rhMax}%
                      </div>
                    </div>

                    {/* Disease warnings */}
                    {assessment.diseaseWarnings.length > 0 && (
                      <div className="space-y-2">
                        {assessment.diseaseWarnings.map((w, i) => (
                          <div
                            key={i}
                            className={`rounded-md border p-3 text-sm ${
                              w.severity === "danger"
                                ? "border-destructive/30 bg-destructive/10"
                                : w.severity === "warning"
                                ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                                : "border-border bg-muted/30"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-medium text-foreground">
                              {w.severity === "danger" ? (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              ) : w.severity === "warning" ? (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              ) : (
                                <Info className="h-4 w-4 text-muted-foreground" />
                              )}
                              {w.title}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                              {w.detail}
                            </p>
                            {w.disease && (
                              <p className="text-xs mt-1">
                                <span className="text-muted-foreground">Risk: </span>
                                <span className="font-medium text-foreground">
                                  {w.disease}
                                </span>
                              </p>
                            )}
                            {w.preventionTip && (
                              <p className="text-xs text-primary mt-1">
                                <span className="font-medium">Fix: </span>
                                {w.preventionTip}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Chart: temp + humidity + VPD over time */}
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-primary" /> Environment
                trend (last {chartData.labels.length} readings)
              </CardTitle>
              <CardDescription>
                Temperature, humidity and VPD over time. VPD is auto-computed
                using the Tetens equation from temp + humidity.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <Line
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: "Temp (°C)",
                      data: chartData.temps,
                      borderColor: "#dc2626",
                      backgroundColor: "rgba(220, 38, 38, 0.15)",
                      yAxisID: "y",
                      tension: 0.3,
                    },
                    {
                      label: "Humidity (%)",
                      data: chartData.humidities,
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59, 130, 246, 0.15)",
                      yAxisID: "y",
                      tension: 0.3,
                    },
                    {
                      label: "VPD (kPa)",
                      data: chartData.vpds,
                      borderColor: "#16a34a",
                      backgroundColor: "rgba(22, 163, 74, 0.15)",
                      yAxisID: "y1",
                      tension: 0.3,
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
                    y: {
                      type: "linear",
                      position: "left",
                      ticks: { font: { size: 10 } },
                      title: { display: true, text: "°C / %", font: { size: 10 } },
                    },
                    y1: {
                      type: "linear",
                      position: "right",
                      ticks: { font: { size: 10 } },
                      title: { display: true, text: "kPa", font: { size: 10 } },
                      grid: { drawOnChartArea: false },
                    },
                    x: { ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45 } },
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Reference: stage ranges */}
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Ideal conditions
                reference
              </CardTitle>
              <CardDescription>
                VPD = saturation vapor pressure × (1 − RH/100). Healthy
                cannabis thrives at the ranges below.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Temp °C</TableHead>
                      <TableHead className="text-right">RH %</TableHead>
                      <TableHead className="text-right">VPD kPa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STAGE_RANGES.map((s) => (
                      <TableRow key={s.label}>
                        <TableCell className="font-medium">{s.label}</TableCell>
                        <TableCell className="text-right">
                          {s.tempMin}–{s.tempMax}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.rhMin}–{s.rhMax}
                        </TableCell>
                        <TableCell className="text-right text-primary font-medium">
                          {s.vpdMin}–{s.vpdMax}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* All readings table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                All environment readings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Tent</TableHead>
                      <TableHead className="text-right">Temp</TableHead>
                      <TableHead className="text-right">RH</TableHead>
                      <TableHead className="text-right">VPD</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.environmentLogs
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.logged_at).getTime() -
                          new Date(a.logged_at).getTime()
                      )
                      .map((l) => {
                        const tent = data.tents.find((t) => t.id === l.tent_id);
                        const vpd = computeVpd(
                          Number(l.temp_c),
                          Number(l.humidity_pct)
                        );
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(l.logged_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tent?.name ?? "—"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(l.temp_c).toFixed(1)}°C
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(l.humidity_pct).toFixed(0)}%
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              {vpd.toFixed(2)} kPa
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[280px] truncate">
                              {l.notes ?? "—"}
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
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit reading" : "Add reading"}
            </DialogTitle>
            <DialogDescription>
              Take a temp + humidity reading from your tent. VPD and stage
              assessment are calculated automatically.
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
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temp_c">Temperature (°C) *</Label>
                <Input
                  id="temp_c"
                  type="number"
                  step="0.1"
                  min="-10"
                  max="60"
                  required
                  value={form.temp_c}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, temp_c: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity_pct">Humidity (%) *</Label>
                <Input
                  id="humidity_pct"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  required
                  value={form.humidity_pct}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, humidity_pct: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Live VPD preview as the user types */}
            <VpdPreview
              tempC={form.temp_c ? Number(form.temp_c) : null}
              humidityPct={form.humidity_pct ? Number(form.humidity_pct) : null}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Lights-on or lights-off? Fan speed? Anything unusual…"
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
                {submitting ? "Saving…" : form.id ? "Save changes" : "Add reading"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this reading?"
        description="The reading will be permanently removed."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
  inRange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  inRange: boolean;
}) {
  return (
    <div
      className={`rounded-md p-3 text-center border ${
        inRange
          ? "border-border bg-muted/30"
          : "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
      }`}
    >
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div
        className={`text-lg font-bold mt-0.5 ${
          inRange ? "text-foreground" : "text-amber-700 dark:text-amber-300"
        }`}
      >
        {value}
        {unit && (
          <span className="text-xs font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function VpdPreview({
  tempC,
  humidityPct,
}: {
  tempC: number | null;
  humidityPct: number | null;
}) {
  if (tempC == null || humidityPct == null) return null;
  if (!isFinite(tempC) || !isFinite(humidityPct)) return null;
  const vpd = computeVpd(tempC, humidityPct);
  const a = computeVpdAssessment(tempC, humidityPct);
  return (
    <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Live preview
        </span>
        <span className="font-semibold text-primary">
          VPD {vpd.toFixed(2)} kPa
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {a.stageAssessment.idealForThisStage
          ? `Ideal for ${a.stageAssessment.label} ✓`
          : `Closest stage: ${a.stageAssessment.label} — adjust environment.`}
      </div>
      {a.diseaseWarnings.length > 0 && (
        <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          {a.diseaseWarnings.length} warning
          {a.diseaseWarnings.length > 1 ? "s" : ""}:{" "}
          {a.diseaseWarnings[0].title}
        </div>
      )}
    </div>
  );
}

void Plus;
