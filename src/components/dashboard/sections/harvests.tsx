"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Sprout, Plus, Pencil, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { formatDate, formatGrams, todayISODate } from "@/lib/format";
import type { Harvest } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  tent_id: string;
  strain_id: string;
  cycle_name: string;
  start_date: string;
  harvest_date: string;
  wet_weight: string;
  dry_weight: string;
  notes: string;
}

export function HarvestsSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      tent_id: data.tents[0]?.id ?? "",
      strain_id: data.strains[0]?.id ?? "",
      cycle_name: "",
      start_date: todayISODate(),
      harvest_date: todayISODate(),
      wet_weight: "0",
      dry_weight: "0",
      notes: "",
    };
  }

  const totals = useMemo(
    () => ({
      wet: data.harvests.reduce((s, h) => s + Number(h.wet_weight), 0),
      dry: data.harvests.reduce((s, h) => s + Number(h.dry_weight), 0),
      ratio:
        data.harvests.reduce((s, h) => s + Number(h.wet_weight), 0) > 0
          ? (data.harvests.reduce((s, h) => s + Number(h.dry_weight), 0) /
              data.harvests.reduce((s, h) => s + Number(h.wet_weight), 0)) *
            100
          : 0,
    }),
    [data.harvests]
  );

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (rec: Harvest) => {
    setForm({
      id: rec.id,
      tent_id: rec.tent_id ?? "",
      strain_id: rec.strain_id ?? "",
      cycle_name: rec.cycle_name,
      start_date: rec.start_date ?? "",
      harvest_date: rec.harvest_date ?? "",
      wet_weight: String(rec.wet_weight),
      dry_weight: String(rec.dry_weight),
      notes: rec.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cycle_name.trim()) {
      toast.error("Cycle name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertHarvest({
        id: form.id,
        tent_id: form.tent_id || null,
        strain_id: form.strain_id || null,
        cycle_name: form.cycle_name.trim(),
        start_date: form.start_date || null,
        harvest_date: form.harvest_date || null,
        wet_weight: Number(form.wet_weight),
        dry_weight: Number(form.dry_weight),
        notes: form.notes.trim() || null,
      });
      toast.success(form.id ? "Harvest updated." : "Harvest added.");
      setOpen(false);
    } catch {
      toast.error("Failed to save harvest.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteHarvest(deleteId);
      toast.success("Harvest deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete harvest.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Harvests"
        description="Record every harvest cycle with wet and dry weights. The wet-to-dry ratio is automatically calculated for yield tracking."
        actionLabel="Add harvest"
        onAction={openCreate}
      />

      {data.harvests.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Total wet
              </div>
              <div className="text-xl font-bold mt-1">
                {formatGrams(totals.wet)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Total dry
              </div>
              <div className="text-xl font-bold mt-1">
                {formatGrams(totals.dry)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Wet-to-dry ratio
              </div>
              <div className="text-xl font-bold mt-1 text-primary">
                {totals.ratio.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {data.loading ? (
        <LoadingState label="Loading harvests…" />
      ) : data.harvests.length === 0 ? (
        <EmptyState
          icon={<Sprout className="h-6 w-6" />}
          title="No harvests yet"
          description="Record each harvest with cycle name, wet weight, and dry weight to track yield per tent and per season."
          actionLabel="Add harvest"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.harvests.length} harvest
              {data.harvests.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Strain</TableHead>
                    <TableHead>Tent</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Harvested</TableHead>
                    <TableHead className="text-right">Wet</TableHead>
                    <TableHead className="text-right">Dry</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-right">Photos</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.harvests.map((h) => {
                    const tent = data.tents.find((t) => t.id === h.tent_id);
                    const strain = data.strains.find((s) => s.id === h.strain_id);
                    const photoCount = data.harvestPhotos.filter(
                      (p) => p.harvest_id === h.id
                    ).length;
                    const ratio =
                      Number(h.wet_weight) > 0
                        ? (Number(h.dry_weight) / Number(h.wet_weight)) * 100
                        : 0;
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">
                          {h.cycle_name}
                        </TableCell>
                        <TableCell>
                          {strain ? (
                            <Badge variant="secondary">{strain.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tent?.name ?? "Unassigned"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(h.start_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(h.harvest_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatGrams(Number(h.wet_weight))}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatGrams(Number(h.dry_weight))}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {ratio.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {photoCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                              <ImagePlus className="h-3.5 w-3.5" />
                              {photoCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(h)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(h.id)}
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
              {form.id ? "Edit harvest" : "Add harvest"}
            </DialogTitle>
            <DialogDescription>
              Track wet and dry yield per cycle. Dry weight is what counts
              toward sellable stock and break-even calculations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cycle_name">Cycle name *</Label>
                <Input
                  id="cycle_name"
                  required
                  value={form.cycle_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cycle_name: e.target.value }))
                  }
                  placeholder="Cycle #1 — Critical Mass"
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
                    <SelectItem value="none">Unassigned</SelectItem>
                    {data.tents.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="strain_id">Strain</Label>
                <Select
                  value={form.strain_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      strain_id: v === "none" ? "" : v,
                    }))
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
                        {s.type ? ` (${s.type})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                <Label htmlFor="harvest_date">Harvest date</Label>
                <Input
                  id="harvest_date"
                  type="date"
                  value={form.harvest_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, harvest_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wet_weight">Wet weight (g)</Label>
                <Input
                  id="wet_weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.wet_weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, wet_weight: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dry_weight">Dry weight (g)</Label>
                <Input
                  id="dry_weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.dry_weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dry_weight: e.target.value }))
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
                placeholder="Strain, technique, issues encountered…"
                rows={3}
              />
            </div>

            {form.id && (
              <HarvestPhotosEditor harvestId={form.id} />
            )}
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
                  : "Add harvest"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this harvest?"
        description="The harvest record and all its photos will be permanently removed."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HarvestPhotosEditor — embedded inside the harvest edit dialog. Lets the
// user upload, view, and delete photos for the harvest being edited.
// ---------------------------------------------------------------------------
function HarvestPhotosEditor({ harvestId }: { harvestId: string }) {
  const data = useData();
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const photos = data.harvestPhotos.filter((p) => p.harvest_id === harvestId);

  // Fetch signed URLs for each photo (only in real Supabase mode — demo
  // mode returns null and we render a placeholder instead).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const photo of photos) {
        if (urls[photo.id]) continue;
        const url = await data.getHarvestPhotoUrl(photo);
        if (!cancelled && url) {
          setUrls((u) => ({ ...u, [photo.id]: url }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length, harvestId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await data.uploadHarvestPhoto(harvestId, file);
      }
      toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo(s).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onDelete = async (id: string) => {
    try {
      await data.deleteHarvestPhoto(id);
      toast.success("Photo deleted.");
    } catch {
      toast.error("Failed to delete photo.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Photos</Label>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5" />
                Add photos
              </>
            )}
          </span>
        </label>
      </div>
      {photos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No photos yet. Upload harvest-day, drying, or finished-product
          shots. Max 10 MB per image (jpg / png / webp / gif).
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-md overflow-hidden border border-border bg-muted"
            >
              {urls[photo.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[photo.id]}
                  alt={photo.caption ?? photo.file_name ?? "harvest photo"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-5 w-5" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onDelete(photo.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-destructive hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete photo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-background/80 text-[10px] truncate">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
