"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { computeDashboardKpis, computeDirectorSplits } from "@/lib/calculations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import type { Director } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  name: string;
  percentage: string;
}

export function DirectorsSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return { name: "", percentage: "0" };
  }

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

  const totalPercentage = useMemo(
    () => data.directors.reduce((s, d) => s + Number(d.percentage), 0),
    [data.directors]
  );
  const percentagesComplete = Math.abs(totalPercentage - 100) < 0.01;

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: Director) => {
    setForm({
      id: rec.id,
      name: rec.name,
      percentage: String(rec.percentage),
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Director name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertDirector({
        id: form.id,
        name: form.name.trim(),
        percentage: Number(form.percentage),
      });
      toast.success(form.id ? "Director updated." : "Director added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save director.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteDirector(deleteId);
      toast.success("Director deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete director.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Company & Director Distribution"
        description="Configure the company's percentage of net profit and how the directors' share is split. Updates flow to the break-even and reports pages."
        actionLabel="Add director"
        onAction={openCreate}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profit split</CardTitle>
            <CardDescription>
              How each Rand of profit is allocated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Company</span>
                <span className="text-primary font-semibold">
                  {formatPercent(data.settings?.company_percentage ?? 30)}%
                </span>
              </div>
              <Progress
                value={data.settings?.company_percentage ?? 30}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Directors pool</span>
                <span className="text-primary font-semibold">
                  {formatPercent(100 - (data.settings?.company_percentage ?? 30))}%
                </span>
              </div>
              <Progress
                value={100 - (data.settings?.company_percentage ?? 30)}
                className="h-2"
              />
            </div>
            <div className="pt-2 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross profit</span>
                <span className="font-semibold">
                  {formatCurrency(kpis.grossProfit, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span>
                  {formatCurrency(kpis.companyShare, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Directors pool</span>
                <span className="text-primary font-semibold">
                  {formatCurrency(kpis.directorShare, currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Directors
            </CardTitle>
            <CardDescription>
              Total declared percentage:{" "}
              <span
                className={
                  percentagesComplete
                    ? "text-primary font-semibold"
                    : "text-amber-600 font-medium"
                }
              >
                {formatPercent(totalPercentage)}%
              </span>{" "}
              {percentagesComplete ? (
                "(split applies as-declared)"
              ) : (
                <span className="text-amber-600">
                  — pool is distributed proportionally
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.loading ? (
              <LoadingState label="Loading directors…" />
            ) : data.directors.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No directors yet"
                  description="Add directors and their profit share percentage to see individual distributions."
                  actionLabel="Add director"
                  onAction={openCreate}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Declared %</TableHead>
                      <TableHead className="text-right">Effective %</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directorSplits.map(({ director, amount, effectivePercentage }) => (
                      <TableRow key={director.id}>
                        <TableCell className="font-medium">
                          {director.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercent(Number(director.percentage))}%
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {effectivePercentage.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(amount, currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(director)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(director.id)}
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
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit director" : "Add director"}
            </DialogTitle>
            <DialogDescription>
              Director percentages are interpreted as proportions of the
              directors&apos; pool. If they don&apos;t sum to 100%, the pool
              is split proportionally.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage share</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.percentage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, percentage: e.target.value }))
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
                  : "Add director"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this director?"
        description="The director's share will be redistributed proportionally among the remaining directors."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

void formatNumber;
