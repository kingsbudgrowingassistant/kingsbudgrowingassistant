"use client";

import { useRouter } from "@/lib/router";
import { useSite } from "@/lib/site-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Leaf,
  LayoutDashboard,
  Zap,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  Cloud,
  Smartphone,
  Sparkles,
} from "lucide-react";

export function LandingPage() {
  const { navigate } = useRouter();
  const { settings, assetForSlot, assetUrl } = useSite();
  const logoAsset = assetForSlot("logo");
  const logoUrl = assetUrl(logoAsset);

  const brandName = settings?.brand_name ?? "Kings Bud";
  const brandTagline = settings?.brand_tagline ?? "Grow Assistant";
  const heroHeadline =
    settings?.hero_headline ??
    "Grow smarter. Track every gram, watt, and rand from any device.";
  const heroSubtext =
    settings?.hero_subtext ??
    "Cloud-based cultivation business assistant with secure multi-user authentication, multi-device sync, and break-even tracking — backed by Supabase and protected by Row Level Security.";
  const announcement = settings?.announcement;

  return (
    <div className="min-h-screen flex flex-col cannabis-bg-dark">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="leading-tight">
              <div className="font-bold text-base">{brandName}</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">
                {brandTagline}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("login")}
            >
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate("register")}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {announcement && (
        <div className="bg-primary text-primary-foreground text-center text-sm py-2 px-4">
          <span className="font-medium">{announcement}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <section className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Cloud className="h-3.5 w-3.5" /> Cloud-based · Account required
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
              {heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {heroSubtext}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate("register")}>
                <Sparkles className="h-4 w-4" />
                Create your free account
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("login")}
              >
                Log in
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Email
                verification required
              </span>
              <span className="flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-primary" /> Multi-device sync
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" /> Installable
                PWA
              </span>
            </div>
            <p className="text-xs text-muted-foreground/80 pt-1">
              You must register an account before you can use the dashboard.
              Owner account for admin access:{" "}
              <code className="px-1 py-0.5 bg-muted rounded">Kingsbud2k25@gmail.com</code>{" "}
              — register with this email to become the admin automatically.
            </p>
          </div>
          <div className="relative">
            <Card className="overflow-hidden border-primary/20 shadow-xl">
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard preview
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 p-4">
                {[
                  { label: "Active tents", value: "4" },
                  { label: "Monthly kWh", value: "540" },
                  { label: "Electricity", value: "R1 890" },
                  { label: "Total revenue", value: "R48 200" },
                  { label: "Total harvests", value: "2.4 kg" },
                  { label: "Net profit", value: "R21 450" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg bg-muted/50 p-3 text-center"
                  >
                    <div className="text-xs text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-lg font-bold mt-0.5">{s.value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: LayoutDashboard,
              title: "Dashboard",
              desc: "Live KPIs across tents, lights, electricity, harvests and revenue — recalculated the moment data changes.",
            },
            {
              icon: Zap,
              title: "Lights & electricity",
              desc: "Per-light wattage × hours × quantity × 30 days = monthly kWh and Rand cost. Per-tent daily and monthly electricity breakdown.",
            },
            {
              icon: Calendar,
              title: "Harvests & seasons",
              desc: "Track wet/dry weights per strain, group records by season, and view per-season profit, margin and overheads.",
            },
            {
              icon: DollarSign,
              title: "Revenue & break-even",
              desc: "Sales per product, automatic revenue = quantity × price/g, break-even gram target per month, yield-per-watt efficiency report.",
            },
            {
              icon: Users,
              title: "Company & directors split",
              desc: "Default 25% company + 25% × 3 directors. Customise percentages, see each director's slice of the net profit pool.",
            },
            {
              icon: TrendingUp,
              title: "Reports & monthly email",
              desc: "Interactive Chart.js visualisations, CSV export, monthly P&L email via Supabase Edge Function + Resend.",
            },
          ].map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardHeader>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl bg-primary/5 border border-primary/20 p-6 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Built on a free-tier stack
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Next.js + Supabase Auth + PostgreSQL + Row Level Security +
            Chart.js, deployable to Vercel or Netlify without paying for a
            server.
          </p>
          <Button size="lg" onClick={() => navigate("register")}>
            <Sparkles className="h-4 w-4" />
            Register to start tracking your grow — free
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} {brandName} {brandTagline}</div>
          <div className="text-muted-foreground/70">
            Secure cloud sync · Multi-device · PWA-installable
          </div>
        </div>
      </footer>
    </div>
  );
}
