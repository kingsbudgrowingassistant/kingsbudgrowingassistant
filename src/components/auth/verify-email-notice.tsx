"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Leaf, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function VerifyEmailNotice() {
  const { navigate } = useRouter();
  const { user, session } = useAuth();
  const [resending, setResending] = useState(false);

  // Poll for verification every 10s while this screen is shown.
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.refreshSession();
      if (data?.user?.email_confirmed_at || data?.user?.confirmed_at) {
        toast.success("Email verified! Loading dashboard…");
        navigate("dashboard");
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const resend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (error) {
        toast.error("Unable to resend verification email.");
      } else {
        toast.success("Verification email resent.");
      }
    } finally {
      setResending(false);
    }
  };

  const signOutAndLogin = async () => {
    await supabase.auth.signOut();
    navigate("login");
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
          <CardHeader className="text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              {session
                ? `Hi ${user?.user_metadata?.full_name ?? "there"} — we sent a verification link to ${user?.email ?? "your email"}.`
                : "We sent a verification link to your email."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Click the link in your inbox to activate your account. The
              dashboard is locked until verification is complete.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking verification status automatically every 10 seconds.
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={resend}
                disabled={resending || !user?.email}
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resending…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={signOutAndLogin}>
                Sign out and log in with a different account
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
