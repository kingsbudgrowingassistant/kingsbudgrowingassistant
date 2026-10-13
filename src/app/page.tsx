"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";
import { DemoDataProvider } from "@/lib/demo-data-context";
import { SiteProvider, useSite } from "@/lib/site-context";
import { useRouter, type PageKey } from "@/lib/router";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isDemoMode, setDemoMode, DEMO_USER } from "@/lib/demo-mode";
import { DEMO_PROFILE } from "@/lib/demo-data";
import { LandingPage } from "@/components/landing/landing-page";
import { AuthRouter } from "@/components/auth/auth-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DemoModeBanner } from "@/components/pwa/demo-mode-banner";
import { Loader2, Database, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <SiteProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </SiteProvider>
  );
}

function AppGate() {
  const { loading, session } = useAuth();
  // Lazy-init from localStorage — only runs on the client. The initial
  // server render sees `false`, which is fine because we render a loading
  // spinner before the auth session resolves anyway.
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemo(isDemoMode());
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 cannabis-bg-dark">
        <div className="flex items-center gap-3 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg font-semibold">
            Loading Kings Bud Grow Assistant…
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Checking authentication session
        </p>
      </div>
    );
  }

  // Demo mode overrides everything (Supabase isn't configured OR user
  // explicitly opted in even with real env vars, which is unusual but
  // supported for preview purposes).
  if (demo && !session) {
    return (
      <DemoApp
        onExit={() => {
          setDemoMode(false);
          setDemo(false);
          if (typeof window !== "undefined") window.location.hash = "";
          window.location.reload();
        }}
      />
    );
  }

  if (!isSupabaseConfigured) {
    return <ConfigureSupabaseNotice onTryDemo={() => {
      setDemoMode(true);
      setDemo(true);
    }} />;
  }

  return (
    <DataProvider>
      <RootRouter />
    </DataProvider>
  );
}

function DemoApp({ onExit }: { onExit: () => void }) {
  // Inject demo session into auth context by overriding useAuth in children.
  // We do this by setting the auth context's session via a wrapper.
  return (
    <DemoAuthProviderWrapper onExit={onExit} />
  );
}

function DemoAuthProviderWrapper({ onExit }: { onExit: () => void }) {
  return (
    <DemoSessionInjector>
      <DemoDataProvider>
        <div className="flex flex-col min-h-screen cannabis-bg-dark">
          <DemoModeBanner onExit={onExit} />
          <div className="flex-1">
            <DashboardShell />
          </div>
        </div>
      </DemoDataProvider>
    </DemoSessionInjector>
  );
}

// The auth context reads from Supabase, which won't have a session in demo
// mode. We work around this by directly rendering the dashboard with demo
// data — the auth context's `useAuth()` will return null/undefined session,
// but the dashboard doesn't depend on it for rendering when wrapped in
// DemoDataProvider (which provides data context directly).
//
// The topbar DOES call useAuth() to show profile info. To handle that,
// we render a fake profile via a context override below.
import { AuthContext } from "@/lib/auth-context";
import type { Session, User } from "@supabase/supabase-js";
import { useMemo } from "react";

function DemoSessionInjector({ children }: { children: React.ReactNode }) {
  const fakeSession = useMemo<Session>(
    () =>
      ({
        access_token: "demo-access-token",
        refresh_token: "demo-refresh-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: DEMO_USER as unknown as User,
      } as unknown as Session),
    []
  );

  const value = useMemo(
    () => ({
      session: fakeSession,
      user: DEMO_USER as unknown as User,
      profile: DEMO_PROFILE,
      isAdmin: true, // Demo user is the owner — show admin nav + admin panel
      loading: false,
      refreshingProfile: false,
      signOut: async () => {},
      refreshProfile: async () => {},
    }),
    [fakeSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function RootRouter() {
  const { session, user } = useAuth();
  const { route, navigate } = useRouter();

  const isAuthRoute =
    route === "login" ||
    route === "register" ||
    route === "forgot-password" ||
    route === "reset-password" ||
    route === "verify-email";

  // Authenticated users on auth pages → send to dashboard
  if (session && user && isAuthRoute) {
    navigate("dashboard");
    return null;
  }

  // Authenticated users on landing → send to dashboard
  if (session && user && (route === "landing" || route === "verify-email")) {
    navigate("dashboard");
    return null;
  }

  // Dashboard access requires email verified.
  const emailVerified = user?.email_confirmed_at || user?.confirmed_at;
  if (
    session &&
    user &&
    (route === "dashboard" || route.startsWith("dashboard:")) &&
    !emailVerified
  ) {
    return <AuthRouter page="verify-email" />;
  }

  if (session && user && (route === "dashboard" || route.startsWith("dashboard:"))) {
    return <DashboardShell />;
  }

  // Unauthenticated user on dashboard → login
  if (!session && (route === "dashboard" || route.startsWith("dashboard:"))) {
    navigate("login");
    return null;
  }

  // Auth routes — login, register, etc.
  if (isAuthRoute) {
    return <AuthRouter page={route as PageKey} />;
  }

  // Default — landing page
  return <LandingPage />;
}

function ConfigureSupabaseNotice({
  onTryDemo,
}: {
  onTryDemo: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 cannabis-bg-dark">
      <div className="max-w-3xl w-full space-y-6 p-8 rounded-2xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="Kings Bud logo"
              className="h-12 w-12 object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">Let's get your app live! 🚀</h1>
            <p className="text-sm text-muted-foreground">
              Follow these 3 steps — takes ~10 minutes total
            </p>
          </div>
        </div>

        {/* Step 1 */}
        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
            <h2 className="font-semibold">Deploy to Netlify (gets you a live URL)</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-9 leading-relaxed">
            Push this project to GitHub, then connect it to Netlify:
          </p>
          <div className="ml-9 flex flex-wrap gap-2">
            <a
              href="https://app.netlify.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00C7B7] px-4 py-2 text-sm font-medium text-white hover:bg-[#00B5A6] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 256 128" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M53.4 76.5l13.3-37.2 14 37.2H53.4zm57.5 42.7L83.6 33.1h-13L43.4 119.2h13.1l6.5-18.2h31l6.5 18.2h10.4zm88.6 0V33.1h-13.1v55.6L154.6 33.1h-13.9v86.1h13.1V63.7l32.4 55.5h12.8z"/>
              </svg>
              Deploy to Netlify
            </a>
            <a
              href="https://app.netlify.com/drop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Or drag-drop the static-html-export/ folder → Netlify Drop
            </a>
          </div>
          <p className="text-xs text-muted-foreground ml-9 mt-1">
            Sign in with GitHub → "Add new site" → "Import an existing project" → pick your repo → click "Deploy site" (skip env vars for now).
            You'll get a URL like <code className="text-primary">https://kings-bud.netlify.app</code>
          </p>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
            <h2 className="font-semibold">Set up Supabase (database + auth)</h2>
          </div>
          <ol className="text-sm text-muted-foreground ml-9 space-y-1.5 list-decimal pl-4">
            <li>
              Go to{" "}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a>{" "}
              → sign in → click <strong>"New project"</strong> → fill in name + password → <strong>Free</strong> plan
            </li>
            <li>
              Once created → click <strong>"SQL Editor"</strong> in the left sidebar → <strong>"New query"</strong>
            </li>
            <li>
              Open <code className="text-primary">supabase/schema.sql</code> from your downloaded project → select all (Ctrl+A) → copy → paste into Supabase → click <strong>"Run"</strong>
            </li>
            <li>
              Go to <strong>Project Settings</strong> (gear icon) → <strong>API</strong> → copy these 2 values:
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                <div><strong>Project URL:</strong> <code className="text-primary">https://xxxxx.supabase.co</code></div>
                <div><strong>anon public key:</strong> <code className="text-primary">eyJ...</code> (starts with eyJ)</div>
              </div>
            </li>
            <li>
              Go to <strong>Authentication</strong> → <strong>URL Configuration</strong> → set <strong>Site URL</strong> = your Vercel URL (e.g. <code className="text-primary">https://kings-bud.vercel.app</code>) → <strong>Save</strong>
            </li>
          </ol>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
            <h2 className="font-semibold">Connect Netlify to Supabase + register</h2>
          </div>
          <ol className="text-sm text-muted-foreground ml-9 space-y-1.5 list-decimal pl-4">
            <li>
              Netlify → your site → <strong>Site settings</strong> → <strong>Environment variables</strong> → add these 2:
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                <div className="rounded bg-muted/50 p-2">
                  <strong>NEXT_PUBLIC_SUPABASE_URL</strong> = <code className="text-primary">https://xxxxx.supabase.co</code>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> = <code className="text-primary">eyJ...</code>
                </div>
              </div>
            </li>
            <li>
              Netlify → <strong>Deploys</strong> → <strong>Trigger deploy</strong> → <strong>Deploy site</strong>
            </li>
            <li>
              Visit your live URL → click <strong>"Get started"</strong> → register with email <code className="text-primary">Kingsbud2k25@gmail.com</code> + a strong password → verify email → log in
            </li>
          </ol>
          <p className="text-xs text-primary ml-9 mt-1 font-medium">
            ✅ You're now the admin — the sidebar shows "Admin Panel"!
          </p>
        </div>

        {/* Try demo button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onTryDemo} variant="outline" className="flex-1">
            <Sparkles className="h-4 w-4" /> Skip setup — try demo dashboard
          </Button>
        </div>

        {/* Quick help */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm">
          <p className="font-medium mb-1">📖 Full instructions + troubleshooting:</p>
          <p className="text-muted-foreground text-xs">
            Open <code className="text-primary">DEPLOYMENT.md</code> from your download — it has screenshots, exact copy-paste commands, and a troubleshooting table for every common error.
          </p>
        </div>
      </div>
    </div>
  );
}
