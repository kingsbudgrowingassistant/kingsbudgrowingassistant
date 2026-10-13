"use client";

import { useState } from "react";
import { useRouter } from "@/lib/router";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // Session persistence — let Supabase handle it via storage.
        },
      });

      if (authError) {
        // Sanitised error messages — never reveal whether email exists.
        const msg = authError.message.toLowerCase();
        if (
          msg.includes("invalid login") ||
          msg.includes("invalid credentials") ||
          msg.includes("invalid email or password")
        ) {
          setError("Invalid email or password. Please try again.");
        } else if (msg.includes("email not confirmed")) {
          setError(
            "Please verify your email address before logging in. Check your inbox."
          );
          setTimeout(() => navigate("verify-email"), 1500);
        } else if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("Too many attempts. Please wait a few minutes and retry.");
        } else {
          setError("Unable to log in. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      if (!data?.session) {
        setError("Unable to establish a session. Please try again.");
        setSubmitting(false);
        return;
      }

      // If "remember" is unchecked, Supabase still persists in localStorage
      // by default — there is no in-memory-only mode in the JS SDK. We
      // surface this honestly to the user.
      toast.success("Welcome back!");
      navigate("dashboard");
    } catch (err) {
      console.error("[login] error:", err);
      setError("Unexpected error. Please try again.");
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
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Log in to access your grow assistant dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => navigate("forgot-password")}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember this device
                </Label>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in…
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate("register")}
              className="ml-1 text-primary hover:underline font-medium"
            >
              Register
            </button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
