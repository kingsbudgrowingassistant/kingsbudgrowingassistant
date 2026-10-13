"use client";

import { useState } from "react";
import { useRouter } from "@/lib/router";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Leaf, Loader2, CheckCircle2 } from "lucide-react";
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

export function ResetPasswordForm() {
  const { navigate } = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordChecks = PASSWORD_RULES.map((r) => ({
    ...r,
    passed: r.test(password),
  }));
  const passwordStrength = passwordChecks.filter((c) => c.passed).length;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    passwordStrength === PASSWORD_RULES.length && passwordsMatch;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData, error: userErr } =
        await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        setError(
          "Your reset link is invalid or has expired. Please request a new one."
        );
        setSubmitting(false);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      });
      if (updateErr) {
        const msg = updateErr.message.toLowerCase();
        if (msg.includes("same password") || msg.includes("weak")) {
          setError("This password is not strong enough or has been used recently.");
        } else if (msg.includes("session")) {
          setError(
            "Your reset link has expired. Please request a new one from the login page."
          );
        } else {
          setError("Unable to update your password. Please try again.");
        }
        setSubmitting(false);
        return;
      }
      setDone(true);
      toast.success("Password updated. You can now log in.");
    } catch (err) {
      console.error("[reset-password] error:", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col cannabis-bg-dark safe-top">
      <header className="px-4 py-4 max-w-6xl mx-auto w-full">
        <button
          onClick={() => navigate("landing")}
          className="flex items-center gap-2"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base">Kings Bud</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">
              Grow Assistant
            </div>
          </div>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Set a new password</CardTitle>
            <CardDescription>
              Choose a strong password — your old password will no longer work.
            </CardDescription>
          </CardHeader>
          {done ? (
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Your password has been updated successfully. You can now log in
                with your new password.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  supabase.auth.signOut();
                  navigate("login");
                }}
              >
                Continue to login
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={onSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                  {password.length > 0 && (
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
                    placeholder="••••••••"
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !canSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </CardContent>
            </form>
          )}
          <CardFooter className="justify-center text-sm text-muted-foreground">
            <button
              onClick={() => navigate("login")}
              className="text-primary hover:underline font-medium"
            >
              Back to login
            </button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
