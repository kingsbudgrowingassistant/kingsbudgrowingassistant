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
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, formatGrams, todayISODate } from "@/lib/format";
import type { Sale } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  date: string;
  product: string;
  quantity: string;
  price_per_gram: string;
  season_id: string;
}

export function RevenueSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      date: todayISODate(),
      product: "",
      quantity: "",
      price_per_gram: "",
      season_id: data.seasons[0]?.id ?? "",
    };
  }

  const currency = data.settings?.currency ?? "ZAR";

  const totals = useMemo(
    () => ({
      revenue: data.sales.reduce((s, x) => s + Number(x.revenue), 0),
      grams: data.sales.reduce((s, x) => s + Number(x.quantity), 0),
      avg:
        data.sales.reduce((s, x) => s + Number(x.quantity), 0) > 0
          ? data.sales.reduce((s, x) => s + Number(x.revenue), 0) /
            data.sales.reduce((s, x) => s + Number(x.quantity), 0)
          : 0,
    }),
    [data.sales]
  );

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: Sale) => {
    setForm({
      id: rec.id,
      date: rec.date,
      product: rec.product,
      quantity: String(rec.quantity),
      price_per_gram: String(rec.price_per_gram),
      season_id: rec.season_id ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (Number(form.quantity) <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }
    if (Number(form.price_per_gram) < 0) {
      toast.error("Price per gram must be 0 or greater.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertSale({
        id: form.id,
        date: form.date,
        product: form.product.trim(),
        quantity: Number(form.quantity),
        price_per_gram: Number(form.price_per_gram),
        season_id: form.season_id || null,
      });
      toast.success(form.id ? "Sale updated." : "Sale added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save sale.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteSale(deleteId);
      toast.success("Sale deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete sale.");
    } finally {
      setDeleting(false);
    }
  };

  const computedRevenue =
    Number(form.quantity) * Number(form.price_per_gram) || 0;

  return (
    <div>
      <SectionHeader
        title="Revenue"
        description="Record every sale. Revenue is automatically computed from quantity × price per gram. Average price/g feeds into break-even calculations."
        actionLabel="Add sale"
        onAction={openCreate}
      />

      {data.sales.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Total revenue
              </div>
              <div className="text-xl font-bold mt-1">
                {formatCurrency(totals.revenue, currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Grams sold
              </div>
              <div className="text-xl font-bold mt-1">
                {formatGrams(totals.grams)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Avg price / g
              </div>
              <div className="text-xl font-bold mt-1 text-primary">
                {formatCurrency(totals.avg, currency)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {data.loading ? (
        <LoadingState label="Loading sales…" />
      ) : data.sales.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-6 w-6" />}
          title="No sales yet"
          description="Add a sale to track revenue against your overheads. The dashboard will recalculate profit/loss and break-even immediately."
          actionLabel="Add sale"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.sales.length} sale{data.sales.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead className="text-right">Qty (g)</TableHead>
                    <TableHead className="text-right">Price/g</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sales.map((s) => {
                    const season = data.seasons.find((x) => x.id === s.season_id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(s.date)}
                        </TableCell>
                        <TableCell className="font-medium">{s.product}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {season?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatGrams(Number(s.quantity))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(s.price_per_gram), currency)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(Number(s.revenue), currency)}
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
            <DialogTitle>{form.id ? "Edit sale" : "Add sale"}</DialogTitle>
            <DialogDescription>
              Revenue is computed automatically as quantity × price per gram.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product name *</Label>
              <Input
                id="product"
                required
                value={form.product}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product: e.target.value }))
                }
                placeholder="Critical Mass — top shelf"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (g) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_per_gram">Price / g *</Label>
                <Input
                  id="price_per_gram"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.price_per_gram}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price_per_gram: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
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
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
              Computed revenue:{" "}
              <strong className="text-primary">
                {formatCurrency(computedRevenue, currency)}
              </strong>
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
                  : "Add sale"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this sale?"
        description="The sale will be permanently removed from your revenue records."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
