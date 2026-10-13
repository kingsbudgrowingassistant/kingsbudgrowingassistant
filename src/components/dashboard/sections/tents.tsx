"use client";

import { useState } from "react";
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
import { Tent as TentIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate, todayISODate } from "@/lib/format";
import type { Tent } from "@/lib/supabase/types";
import { toast } from "sonner";

interface FormState {
  id?: string;
  name: string;
  location: string;
  dimensions: string;
  status: string;
  notes: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", variant: "default" as const },
  { value: "inactive", label: "Inactive", variant: "secondary" as const },
  { value: "maintenance", label: "Maintenance", variant: "outline" as const },
];

export function TentsSection() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  function emptyForm(): FormState {
    return {
      name: "",
      location: "",
      dimensions: "",
      status: "active",
      notes: "",
    };
  }

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (tent: Tent) => {
    setForm({
      id: tent.id,
      name: tent.name,
      location: tent.location ?? "",
      dimensions: tent.dimensions ?? "",
      status: tent.status,
      notes: tent.notes ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tent name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await data.upsertTent({
        id: form.id,
        name: form.name.trim(),
        location: form.location.trim() || null,
        dimensions: form.dimensions.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      });
      toast.success(form.id ? "Tent updated." : "Tent added.");
      setOpen(false);
      setForm(emptyForm());
    } catch (err) {
      console.error(err);
      toast.error("Failed to save tent.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await data.deleteTent(deleteId);
      toast.success("Tent deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete tent.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Tents"
        description="Manage your cultivation tents. Every light, harvest, expense and revenue record can be tied to a tent for accurate reporting."
        actionLabel="Add tent"
        onAction={openCreate}
      />

      {data.loading ? (
        <LoadingState label="Loading tents…" />
      ) : data.tents.length === 0 ? (
        <EmptyState
          icon={<TentIcon className="h-6 w-6" />}
          title="No tents yet"
          description="Add your first cultivation tent to start tracking lights, harvests and expenses against it."
          actionLabel="Add tent"
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.tents.length} tent{data.tents.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tents.map((t) => {
                    const status = STATUS_OPTIONS.find(
                      (s) => s.value === t.status
                    ) ?? STATUS_OPTIONS[0];
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.location ?? "—"}</TableCell>
                        <TableCell>{t.dimensions ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(t.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(t)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(t.id)}
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
            <DialogTitle>{form.id ? "Edit tent" : "Add tent"}</DialogTitle>
            <DialogDescription>
              Tents isolate lights and harvests — useful for tracking multiple
              grow spaces separately.
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
                placeholder="Flower Tent 1"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Spare room"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={form.dimensions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dimensions: e.target.value }))
                  }
                  placeholder="1.2m × 1.2m × 2m"
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
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Internal notes — strains grown, ventilation, etc."
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
                {submitting ? "Saving…" : form.id ? "Save changes" : "Add tent"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this tent?"
        description="Lights and harvests linked to this tent will keep their records but the tent reference will be cleared."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

// silence unused import in some build configs
void todayISODate;
