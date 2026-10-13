"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { computeSeasonKpis } from "@/lib/calculations";
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
import { CalendarDays, Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, todayISODate } from "@/lib/format";
import type { Season } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", variant: "default" as const },
  { value: "completed", label: "Completed", variant: "secondary" as const },
  { value: "planning", label: "Planning", variant: "outline" as const },
];

export function SeasonsSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      name: "",
      start_date: todayISODate(),
      end_date: "",
      status: "active",
    };
  }

  const currency = data.settings?.currency ?? "ZAR";

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: Season) => {
    setForm({
      id: rec.id,
      name: rec.name,
      start_date: rec.start_date,
      end_date: rec.end_date ?? "",
      status: rec.status,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Season name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertSeason({
        id: form.id,
        name: form.name.trim(),
        start_date: form.start_date,
        end_date: form.end_date || null,
        status: form.status,
      });
      toast.success(form.id ? "Season updated." : "Season added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save season.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteSeason(deleteId);
      toast.success("Season deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete season.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Seasons"
        description="Group your harvests, expenses and sales into seasons for per-cycle profitability tracking."
        actionLabel="Add season"
        onAction={openCreate}
      />

      {data.loading ? (
        <LoadingState label="Loading seasons…" />
      ) : data.seasons.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No seasons yet"
          description="Create your first season (e.g. '2025 Winter Cycle') to group related records for reporting."
          actionLabel="Add season"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.seasons.length} season
              {data.seasons.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Costs</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.seasons.map((s) => {
                    const kpis = computeSeasonKpis(
                      s,
                      data.sales,
                      data.expenses
                    );
                    const status =
                      STATUS_OPTIONS.find((o) => o.value === s.status) ??
                      STATUS_OPTIONS[0];
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(s.start_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(s.end_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(kpis.revenue, currency)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          -{formatCurrency(kpis.cost, currency)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            kpis.profit >= 0 ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {formatCurrency(kpis.profit, currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(s)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(s.id)}
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
              {form.id ? "Edit season" : "Add season"}
            </DialogTitle>
            <DialogDescription>
              Seasons help you group harvests, sales and expenses into cycles.
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
                placeholder="2025 Winter Cycle"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  required
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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  : "Add season"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this season?"
        description="Linked sales and expenses will lose their season reference but keep their records."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
