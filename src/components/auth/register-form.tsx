"use client";

import { useState } from "react";
import { useRouter } from "@/lib/router";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
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

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
}

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains a letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "Contains a special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

export function RegisterForm() {
  const { navigate } = useRouter();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const passwordChecks = PASSWORD_RULES.map((r) => ({
    ...r,
    passed: r.test(form.password),
  }));
  const passwordStrength = passwordChecks.filter((c) => c.passed).length;
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const canSubmit =
    form.fullName.trim().length >= 2 &&
    emailValid &&
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
            business_name: form.businessName.trim() || null,
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/#/reset-password`
              : undefined,
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          setError(
            "An account with this email already exists. Try logging in or resetting your password."
          );
        } else if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("Too many attempts. Please wait and try again.");
        } else if (msg.includes("password")) {
          setError("Password does not meet the security requirements.");
        } else {
          setError("Unable to register. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      // If Supabase returns a session immediately (email confirmation disabled),
      // route to dashboard. Otherwise, show the verify-email notice.
      if (data?.session) {
        toast.success("Account created!");
        await refreshProfile();
        navigate("dashboard");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("[register] error:", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <RegisterSuccess
        email={form.email}
        onLoginClick={() => navigate("login")}
      />
    );
  }

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
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Free cloud account — your data syncs across every device.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Jane Doe"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting}
                  aria-invalid={form.email.length > 0 && !emailValid}
                />
                {form.email.length > 0 && !emailValid && (
                  <p className="text-xs text-destructive">
                    Please enter a valid email address.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Business name{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="Kings Bud Cultivation"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                />
                {form.password.length > 0 && (
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
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
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
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account you agree that your data will be stored
                securely in your private Supabase database, isolated from other
                users by Row Level Security.
              </p>
            </CardContent>
          </form>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("login")}
              className="ml-1 text-primary hover:underline font-medium"
            >
              Log in
            </button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

function RegisterSuccess({
  email,
  onLoginClick,
}: {
  email: string;
  onLoginClick: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col cannabis-bg-dark safe-top">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              We sent a verification link to{" "}
              <strong className="text-foreground">{email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Click the link in your inbox to activate your account. You
              won&apos;t be able to access the dashboard until your email is
              verified.
            </p>
            <p>
              If you don&apos;t see the email within a few minutes, check your
              spam folder or request a new link from the login page.
            </p>
            <Button variant="outline" className="w-full" onClick={onLoginClick}>
              Continue to login
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
