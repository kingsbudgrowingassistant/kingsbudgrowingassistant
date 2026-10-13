"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Receipt, Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, todayISODate } from "@/lib/format";
import { ExpensesByCategoryChart } from "../charts";
import type { Expense } from "@/lib/supabase/types";
import { toast } from "sonner";

const CATEGORIES = [
  "Seeds",
  "Nutrients",
  "Substrate / Medium",
  "Pesticides",
  "Equipment",
  "Repairs",
  "Rent",
  "Labour",
  "Packaging",
  "Marketing",
  "Transport",
  "Other",
];

interface FormState {
  id?: string;
  category: string;
  description: string;
  amount: string;
  date: string;
  tent_id: string;
  season_id: string;
}

export function ExpensesSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      category: "Nutrients",
      description: "",
      amount: "",
      date: todayISODate(),
      tent_id: "",
      season_id: "",
    };
  }

  const currency = data.settings?.currency ?? "ZAR";

  const total = useMemo(
    () => data.expenses.reduce((s, e) => s + Number(e.amount), 0),
    [data.expenses]
  );

  const thisMonth = useMemo(() => {
    const now = new Date();
    return data.expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [data.expenses]);

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: Expense) => {
    setForm({
      id: rec.id,
      category: rec.category,
      description: rec.description ?? "",
      amount: String(rec.amount),
      date: rec.date,
      tent_id: rec.tent_id ?? "",
      season_id: rec.season_id ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      toast.error("Category is required.");
      return;
    }
    if (Number(form.amount) <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertExpense({
        id: form.id,
        category: form.category,
        description: form.description.trim() || null,
        amount: Number(form.amount),
        date: form.date,
        tent_id: form.tent_id || null,
        season_id: form.season_id || null,
      });
      toast.success(form.id ? "Expense updated." : "Expense added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteExpense(deleteId);
      toast.success("Expense deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete expense.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Expenses"
        description="Track all outflows by category — seed stock, nutrients, rent, labour and more. Optional tent/season linking improves reporting accuracy."
        actionLabel="Add expense"
        onAction={openCreate}
      />

      {data.expenses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Total all-time
              </div>
              <div className="text-xl font-bold mt-1">
                {formatCurrency(total, currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                This month
              </div>
              <div className="text-xl font-bold mt-1">
                {formatCurrency(thisMonth, currency)}
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                By category
              </div>
              <div className="h-[80px]">
                <ExpensesByCategoryChart
                  expenses={data.expenses.map((e) => ({
                    category: e.category,
                    amount: Number(e.amount),
                  }))}
                  currency={currency}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {data.loading ? (
        <LoadingState label="Loading expenses…" />
      ) : data.expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="No expenses yet"
          description="Add your first expense — nutrients, rent, labour or any outflow — to track overheads against your revenue."
          actionLabel="Add expense"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.expenses.length} expense
              {data.expenses.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Tent</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expenses.map((e) => {
                    const tent = data.tents.find((t) => t.id === e.tent_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(e.date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {e.category}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[220px] truncate">
                          {e.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {tent?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          -{formatCurrency(Number(e.amount), currency)}
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
              {form.id ? "Edit expense" : "Add expense"}
            </DialogTitle>
            <DialogDescription>
              Categorise each outflow to identify your biggest overhead drivers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ZAR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What was this for?"
                rows={2}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tent_id">Tent</Label>
                <Select
                  value={form.tent_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      tent_id: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger id="tent_id">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {data.tents.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
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
                    setForm((f) => ({
                      ...f,
                      season_id: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger id="season_id">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {data.seasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  : "Add expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this expense?"
        description="The expense will be permanently removed from your records."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
