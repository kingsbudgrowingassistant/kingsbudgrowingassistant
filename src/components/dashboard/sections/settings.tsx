"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/data-context";
import { SectionHeader } from "../section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS } from "@/lib/calculations";

const CURRENCIES = [
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
];

export function SettingsSection() {
  const data = useData();
  const [form, setForm] = useState({
    currency: data.settings?.currency ?? DEFAULT_SETTINGS.currency,
    electricity_tariff:
      data.settings?.electricity_tariff ??
      DEFAULT_SETTINGS.electricity_tariff,
    company_percentage:
      data.settings?.company_percentage ??
      DEFAULT_SETTINGS.company_percentage,
    director_count: data.settings?.director_count ??
      DEFAULT_SETTINGS.director_count,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data.settings) {
      setForm({
        currency: data.settings.currency,
        electricity_tariff: data.settings.electricity_tariff,
        company_percentage: data.settings.company_percentage,
        director_count: data.settings.director_count,
      });
    }
  }, [data.settings]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await data.upsertSettings(form);
      toast.success("Settings saved.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Settings"
        description="Business-wide settings that drive calculations across the dashboard, break-even, and reports."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Business configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Display currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, currency: v }))
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity_tariff">
                Default electricity tariff (per kWh)
              </Label>
              <Input
                id="electricity_tariff"
                type="number"
                step="0.01"
                min="0"
                value={String(form.electricity_tariff)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    electricity_tariff: Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                This default applies when no month-specific tariff is set in
                the Electricity section.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_percentage">
                Company profit share (%)
              </Label>
              <Input
                id="company_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={String(form.company_percentage)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    company_percentage: Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                The company retains this percentage of gross profit. The rest
                is split among directors.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="director_count">Number of directors</Label>
              <Input
                id="director_count"
                type="number"
                min="0"
                value={String(form.director_count)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    director_count: Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                For reference only — actual splits come from the Directors
                page.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save settings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
