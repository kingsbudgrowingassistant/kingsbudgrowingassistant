"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, type PageKey } from "@/lib/router";
import { SectionHeader } from "../section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains a letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "Contains a special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

export function ChangePasswordSection() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = PASSWORD_RULES.map((r) => ({
    ...r,
    passed: r.test(newPassword),
  }));
  const passwordStrength = passwordChecks.filter((c) => c.passed).length;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    passwordStrength === PASSWORD_RULES.length &&
    passwordsMatch;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }
    setSubmitting(true);
    try {
      // Re-authenticate the user with current password (Supabase requires a
      // recent session to update password — calling updateUser with current
      // password is unsupported in v2, so we rely on the active session).
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) {
        const msg = updateErr.message.toLowerCase();
        if (msg.includes("same password") || msg.includes("weak")) {
          setError(
            "This password is not strong enough or has been used recently."
          );
        } else if (msg.includes("session")) {
          setError(
            "Your session has expired. Please log out and use the forgot-password flow."
          );
        } else {
          setError("Unable to update your password. Please try again.");
        }
        setSubmitting(false);
        return;
      }
      setDone(true);
      toast.success("Password updated.");
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div>
        <SectionHeader title="Change Password" />
        <Card className="max-w-md">
          <CardContent className="p-6 space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold">Password updated successfully</h3>
            <p className="text-sm text-muted-foreground">
              You can continue using the app. Your new password will be
              required the next time you log in on any device.
            </p>
            <Button onClick={() => router.navigate("dashboard:settings" as PageKey)}>
              Back to settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Change Password"
        description="Choose a strong new password. We never see or store plain-text passwords — Supabase Auth handles everything securely."
      />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Set a new password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Type your current password for safety confirmation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
              />
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {PASSWORD_RULES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < passwordStrength ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                    {passwordChecks.map((c) => (
                      <li
                        key={c.label}
                        className={`flex items-center gap-1 ${
                          c.passed
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                aria-invalid={passwordsMismatch}
              />
              {passwordsMatch && (
                <p className="text-xs text-primary">Passwords match.</p>
              )}
              {passwordsMismatch && (
                <p className="text-xs text-destructive">
                  Passwords do not match.
                </p>
              )}
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
