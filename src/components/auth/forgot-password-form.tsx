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
import { Leaf, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/#/reset-password`
              : undefined,
        }
      );

      // Always show the same "sent" message — even if email doesn't exist —
      // to prevent account enumeration.
      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("Too many attempts. Please wait and try again.");
          setSubmitting(false);
          return;
        }
        // Otherwise fall through to success message.
      }
      setSent(true);
    } catch (err) {
      console.error("[forgot-password] error:", err);
      setSent(true);
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
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a secure reset link.
            </CardDescription>
          </CardHeader>
          {sent ? (
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <MailCheck className="h-7 w-7 text-primary" />
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                If an account exists for{" "}
                <strong className="text-foreground">{email}</strong>, a
                password reset link has been sent. Check your inbox and click
                the link to set a new password.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("login")}
              >
                Back to login
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={onSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={submitting}
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !email}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  We never store plain-text passwords. The reset link expires
                  shortly after sending and can only be used once.
                </p>
              </CardContent>
            </form>
          )}
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <button
              onClick={() => navigate("login")}
              className="ml-1 text-primary hover:underline font-medium"
            >
              Back to login
            </button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
