"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useSite } from "@/lib/site-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { SectionHeader } from "../section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Shield,
  Loader2,
  Save,
  Upload,
  Trash2,
  ImageIcon,
  Users,
  Settings as SettingsIcon,
  Crown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/supabase/types";

const ASSET_SLOTS = [
  { slot: "logo", label: "Logo (square, shown in sidebar + landing header)", hint: "256×256 PNG recommended" },
  { slot: "logo_dark", label: "Logo dark variant (for dark backgrounds)", hint: "256×256 PNG recommended" },
  { slot: "favicon", label: "Favicon", hint: "32×32 PNG" },
  { slot: "hero_background", label: "Hero background (landing page)", hint: "1600×900 JPG, max 1 MB" },
  { slot: "login_background", label: "Auth pages background", hint: "1200×800 JPG" },
  { slot: "landing_hero_image", label: "Landing hero image (right side of hero section)", hint: "800×600 PNG/JPG" },
  { slot: "footer_image", label: "Footer image", hint: "400×100 PNG" },
];

export function AdminSection() {
  const { user, isAdmin } = useAuth();
  const data = useData();
  const { refresh: refreshSite } = useSite();
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [siteAssets, setSiteAssets] = useState<
    { id: string; slot: string; file_name: string | null; storage_path: string; created_at: string }[]
  >([]);

  const [siteForm, setSiteForm] = useState({
    brand_name: "",
    brand_tagline: "",
    hero_headline: "",
    hero_subtext: "",
    primary_color: "#16a34a",
    contact_email: "",
    announcement: "",
  });

  // Load site settings into the form when the SiteProvider loads them.
  const { settings } = useSite();
  useEffect(() => {
    if (settings) {
      setSiteForm({
        brand_name: settings.brand_name ?? "",
        brand_tagline: settings.brand_tagline ?? "",
        hero_headline: settings.hero_headline ?? "",
        hero_subtext: settings.hero_subtext ?? "",
        primary_color: settings.primary_color ?? "#16a34a",
        contact_email: settings.contact_email ?? "",
        announcement: settings.announcement ?? "",
      });
    }
  }, [settings]);

  // Load all site assets (active + inactive) for the admin's library view.
  const loadSiteAssets = async () => {
    if (!isSupabaseConfigured) return;
    const { data: assets, error } = await supabase
      .from("site_assets")
      .select("id, slot, file_name, storage_path, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[admin] assets load error:", error.message);
      return;
    }
    setSiteAssets(assets ?? []);
  };
  useEffect(() => {
    loadSiteAssets();
  }, []);

  // Load all profiles (admin-only read).
  useEffect(() => {
    setLoadingProfiles(true);
    data.listAllProfiles()
      .then((p) => setProfiles(p))
      .catch((err) => {
        console.warn("[admin] profiles load error:", err);
        toast.error("Failed to load user list.");
      })
      .finally(() => setLoadingProfiles(false));
  }, [data]);

  const onSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await data.upsertSiteSettings({
        brand_name: siteForm.brand_name.trim() || "Kings Bud",
        brand_tagline: siteForm.brand_tagline.trim() || "Grow Assistant",
        hero_headline: siteForm.hero_headline.trim(),
        hero_subtext: siteForm.hero_subtext.trim() || null,
        primary_color: siteForm.primary_color || "#16a34a",
        contact_email: siteForm.contact_email.trim() || null,
        announcement: siteForm.announcement.trim() || null,
      });
      await refreshSite();
      toast.success("Site settings saved. Changes are live for all visitors.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save site settings. Are you signed in as admin?");
    } finally {
      setSavingSettings(false);
    }
  };

  const onUpload = async (slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(slot);
    try {
      await data.uploadSiteAsset(slot, file);
      await loadSiteAssets();
      await refreshSite();
      toast.success(`${slot} asset uploaded. Live for all visitors now.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload. Make sure you're signed in as admin.");
    } finally {
      setUploadingSlot(null);
      e.target.value = "";
    }
  };

  const onDelete = async (id: string) => {
    setDeletingAssetId(id);
    try {
      await data.deleteSiteAsset(id);
      await loadSiteAssets();
      await refreshSite();
      toast.success("Asset deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete asset.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div>
        <SectionHeader title="Admin Panel" />
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Admin panel requires Supabase to be configured. Connect Supabase
            (see DEPLOYMENT.md) and sign in as the owner account
            (<code>Kingsbud2k25@gmail.com</code>) to access admin features.
          </CardContent>
        </Card>
      </div>
    );
  }

  // RLS double-check: if the user somehow reaches this route without being
  // admin, show a forbidden screen instead of the form.
  if (!isAdmin) {
    return (
      <div>
        <SectionHeader title="Admin Panel" />
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              <h3 className="text-base font-semibold">Access denied</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              You must be signed in as the owner
              (<code>Kingsbud2k25@gmail.com</code>) to access the admin panel.
              The owner account is auto-granted admin status via a database
              trigger when they register.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Admin Panel"
        description="Owner-only control centre. Edit site branding, logos, hero images, announcement banner, and view all registered users. Changes propagate to every visitor's browser in real time."
        extra={
          <Badge variant="default" className="bg-primary text-primary-foreground">
            <Crown className="h-3 w-3 mr-1" /> Owner
          </Badge>
        }
      />

      {/* Site-wide settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-primary" /> Site branding & content
          </CardTitle>
          <CardDescription>
            Brand name, tagline, hero headline, announcement banner, contact
            email, primary color. Updates appear on the landing page
            immediately for every visitor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveSettings} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand name</Label>
                <Input
                  id="brand_name"
                  value={siteForm.brand_name}
                  onChange={(e) =>
                    setSiteForm((f) => ({ ...f, brand_name: e.target.value }))
                  }
                  placeholder="Kings Bud"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_tagline">Brand tagline</Label>
                <Input
                  id="brand_tagline"
                  value={siteForm.brand_tagline}
                  onChange={(e) =>
                    setSiteForm((f) => ({ ...f, brand_tagline: e.target.value }))
                  }
                  placeholder="Grow Assistant"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_headline">Hero headline (landing page)</Label>
              <Textarea
                id="hero_headline"
                value={siteForm.hero_headline}
                onChange={(e) =>
                  setSiteForm((f) => ({ ...f, hero_headline: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_subtext">Hero subtext</Label>
              <Textarea
                id="hero_subtext"
                value={siteForm.hero_subtext}
                onChange={(e) =>
                  setSiteForm((f) => ({ ...f, hero_subtext: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primary_color"
                    value={siteForm.primary_color}
                    onChange={(e) =>
                      setSiteForm((f) => ({ ...f, primary_color: e.target.value }))
                    }
                    className="h-10 w-14 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={siteForm.primary_color}
                    onChange={(e) =>
                      setSiteForm((f) => ({ ...f, primary_color: e.target.value }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={siteForm.contact_email}
                  onChange={(e) =>
                    setSiteForm((f) => ({ ...f, contact_email: e.target.value }))
                  }
                  placeholder="support@yourdomain.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement">Announcement banner</Label>
                <Input
                  id="announcement"
                  value={siteForm.announcement}
                  onChange={(e) =>
                    setSiteForm((f) => ({ ...f, announcement: e.target.value }))
                  }
                  placeholder="New feature: yield-per-watt report"
                />
              </div>
            </div>
            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save site settings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Asset library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" /> Logos, photos & branding assets
          </CardTitle>
          <CardDescription>
            Upload site-wide images. Each slot overrides the default. All
            uploads go to a public Supabase Storage bucket; only admins can
            write — enforced by RLS at the database layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {ASSET_SLOTS.map((slot) => {
              const slotAssets = siteAssets.filter((a) => a.slot === slot.slot);
              return (
                <div
                  key={slot.slot}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div>
                    <div className="font-medium text-sm">{slot.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {slot.hint}
                    </div>
                  </div>
                  {slotAssets.length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {slotAssets.slice(0, 3).map((a) => {
                        const publicUrl = supabase.storage
                          .from("site-assets")
                          .getPublicUrl(a.storage_path).data?.publicUrl;
                        return (
                          <li
                            key={a.id}
                            className="flex items-center gap-2 justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {publicUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={publicUrl}
                                  alt={a.file_name ?? slot.slot}
                                  className="h-8 w-8 rounded object-cover border border-border"
                                />
                              )}
                              <span className="truncate">
                                {a.file_name ?? a.storage_path.split("/").pop()}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDelete(a.id)}
                              disabled={deletingAssetId === a.id}
                            >
                              {deletingAssetId === a.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 text-destructive" />
                              )}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                      className="hidden"
                      onChange={(e) => onUpload(slot.slot, e)}
                      disabled={uploadingSlot === slot.slot}
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent w-full justify-center">
                      {uploadingSlot === slot.slot ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3" />
                          Upload new {slot.slot.replace(/_/g, " ")}
                        </>
                      )}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Registered users
          </CardTitle>
          <CardDescription>
            All users who have registered on your site. You can see who is an
            admin (only your owner account unless you change it in the SQL
            trigger).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingProfiles ? (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No users registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.full_name ?? "—"}
                      </TableCell>
                      <TableCell>{p.email ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.business_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {p.is_admin ? (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            <Crown className="h-3 w-3 mr-1" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Check className="h-3 w-3 mr-1" /> User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(p.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database + storage info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security & setup
          </CardTitle>
          <CardDescription>
            The admin role is enforced at the database layer — never trust the
            frontend alone. RLS policies on <code>site_settings</code>,
            <code>site_assets</code>, and the <code>site-assets</code> storage
            bucket all check <code>is_admin = true</code> via a sub-query on
            <code>public.profiles</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Signed in as:</strong>{" "}
            <code>{user?.email}</code>
          </p>
          <p>
            <strong>Admin status:</strong>{" "}
            <Badge variant="default" className="bg-primary text-primary-foreground">
              Active
            </Badge>
          </p>
          <p>
            <strong>Owner email</strong> (auto-grants admin on registration):
            <code className="ml-2">Kingsbud2k25@gmail.com</code>
          </p>
          <p className="text-xs pt-2 border-t border-border">
            To change the owner email, edit the constant in
            <code className="mx-1">supabase/schema.sql</code>
            (function <code>set_admin_for_owner</code>) and re-run the script.
            The owner password is whatever they chose during registration —
            it is never stored in the application code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
