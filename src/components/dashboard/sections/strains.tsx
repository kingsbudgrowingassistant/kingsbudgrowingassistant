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
import { Dna, Plus, Pencil, Trash2 } from "lucide-react";
import type { Strain } from "@/lib/supabase/types";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "indica", label: "Indica" },
  { value: "sativa", label: "Sativa" },
  { value: "hybrid", label: "Hybrid" },
  { value: "ruderalis", label: "Ruderalis" },
  { value: "cbd", label: "CBD-dominant" },
];

const TYPE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  indica: "default",
  sativa: "secondary",
  hybrid: "outline",
  ruderalis: "secondary",
  cbd: "default",
};

interface FormState {
  id?: string;
  name: string;
  breeder: string;
  type: string;
  thc_percent: string;
  cbd_percent: string;
  flowering_weeks: string;
  expected_yield_grams: string;
  lineage: string;
  description: string;
}

export function StrainsSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      name: "",
      breeder: "",
      type: "hybrid",
      thc_percent: "",
      cbd_percent: "",
      flowering_weeks: "",
      expected_yield_grams: "",
      lineage: "",
      description: "",
    };
  }

  const harvestsByStrain = useMemo(() => {
    const map: Record<string, { count: number; totalDry: number; avgWet: number }> = {};
    for (const h of data.harvests) {
      if (!h.strain_id) continue;
      const cur = map[h.strain_id] ?? { count: 0, totalDry: 0, avgWet: 0 };
      cur.count += 1;
      cur.totalDry += Number(h.dry_weight);
      cur.avgWet += Number(h.wet_weight);
      map[h.strain_id] = cur;
    }
    // Finalise average wet.
    for (const k of Object.keys(map)) {
      if (map[k].count > 0) map[k].avgWet = map[k].avgWet / map[k].count;
    }
    return map;
  }, [data.harvests]);

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: Strain) => {
    setForm({
      id: rec.id,
      name: rec.name,
      breeder: rec.breeder ?? "",
      type: rec.type ?? "hybrid",
      thc_percent: rec.thc_percent != null ? String(rec.thc_percent) : "",
      cbd_percent: rec.cbd_percent != null ? String(rec.cbd_percent) : "",
      flowering_weeks:
        rec.flowering_weeks != null ? String(rec.flowering_weeks) : "",
      expected_yield_grams:
        rec.expected_yield_grams != null ? String(rec.expected_yield_grams) : "",
      lineage: rec.lineage ?? "",
      description: rec.description ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Strain name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertStrain({
        id: form.id,
        name: form.name.trim(),
        breeder: form.breeder.trim() || null,
        type: form.type,
        thc_percent: form.thc_percent ? Number(form.thc_percent) : null,
        cbd_percent: form.cbd_percent ? Number(form.cbd_percent) : null,
        flowering_weeks: form.flowering_weeks ? Number(form.flowering_weeks) : null,
        expected_yield_grams: form.expected_yield_grams
          ? Number(form.expected_yield_grams)
          : null,
        lineage: form.lineage.trim() || null,
        description: form.description.trim() || null,
      });
      toast.success(form.id ? "Strain updated." : "Strain added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save strain.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteStrain(deleteId);
      toast.success("Strain deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete strain.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Strains"
        description="Track your genetics — breeder, lineage, THC/CBD, flowering time and expected yield. Link harvests to strains to compare actual vs expected performance."
        actionLabel="Add strain"
        onAction={openCreate}
      />

      {data.loading ? (
        <LoadingState label="Loading strains…" />
      ) : data.strains.length === 0 ? (
        <EmptyState
          icon={<Dna className="h-6 w-6" />}
          title="No strains yet"
          description="Add your first strain to track genetics, lineage and expected yields. Then link each harvest to its strain to compare performance."
          actionLabel="Add strain"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.strains.length} strain{data.strains.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Breeder</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">THC %</TableHead>
                    <TableHead className="text-right">CBD %</TableHead>
                    <TableHead className="text-right">Flower wks</TableHead>
                    <TableHead className="text-right">Exp yield</TableHead>
                    <TableHead className="text-right">Harvests</TableHead>
                    <TableHead className="text-right">Avg dry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.strains.map((s) => {
                    const stats = harvestsByStrain[s.id];
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium">{s.name}</div>
                          {s.lineage && (
                            <div className="text-[11px] text-muted-foreground">
                              {s.lineage}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {s.breeder ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={TYPE_COLORS[s.type ?? "hybrid"] ?? "outline"}>
                            {s.type ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.thc_percent != null ? `${s.thc_percent}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.cbd_percent != null ? `${s.cbd_percent}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.flowering_weeks != null
                            ? `${s.flowering_weeks}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.expected_yield_grams != null
                            ? `${s.expected_yield_grams} g`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {stats?.count ?? 0}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {stats && stats.count > 0
                            ? `${(stats.totalDry / stats.count).toFixed(0)} g`
                            : "—"}
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
            <DialogTitle>{form.id ? "Edit strain" : "Add strain"}</DialogTitle>
            <DialogDescription>
              Track breeder, lineage, THC/CBD, flowering time and expected
              yield per strain. Harvests can be linked to a strain for
              actual-vs-expected comparisons.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Critical Mass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breeder">Breeder</Label>
                <Input
                  id="breeder"
                  value={form.breeder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, breeder: e.target.value }))
                  }
                  placeholder="Mr. Nice Seeds"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v }))
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thc_percent">THC %</Label>
                <Input
                  id="thc_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.thc_percent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, thc_percent: e.target.value }))
                  }
                  placeholder="19"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cbd_percent">CBD %</Label>
                <Input
                  id="cbd_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.cbd_percent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cbd_percent: e.target.value }))
                  }
                  placeholder="0.4"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flowering_weeks">Flowering weeks</Label>
                <Input
                  id="flowering_weeks"
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={form.flowering_weeks}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, flowering_weeks: e.target.value }))
                  }
                  placeholder="8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_yield_grams">
                  Expected yield (g)
                </Label>
                <Input
                  id="expected_yield_grams"
                  type="number"
                  step="1"
                  min="0"
                  value={form.expected_yield_grams}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expected_yield_grams: e.target.value,
                    }))
                  }
                  placeholder="500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineage">Lineage</Label>
              <Input
                id="lineage"
                value={form.lineage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lineage: e.target.value }))
                }
                placeholder="Critical Mass × Afghani"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Aroma, growth pattern, medical notes…"
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
                  : "Add strain"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this strain?"
        description="Harvests linked to this strain will keep their records but the strain reference will be cleared."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
