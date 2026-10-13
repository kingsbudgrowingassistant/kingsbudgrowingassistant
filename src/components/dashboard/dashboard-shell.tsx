"use client";

import { useMemo, useState } from "react";
import { useRouter, parseDashboardRoute, type PageKey } from "@/lib/router";
import { SidebarNav, NAV_ITEMS } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { OverviewSection } from "./sections/overview";
import { TentsSection } from "./sections/tents";
import { StrainsSection } from "./sections/strains";
import { LightsSection } from "./sections/lights";
import { ElectricitySection } from "./sections/electricity";
import { NutrientLogsSection } from "./sections/nutrient-logs";
import { EnvironmentSection } from "./sections/environment";
import { ExpensesSection } from "./sections/expenses";
import { HarvestsSection } from "./sections/harvests";
import { RevenueSection } from "./sections/revenue";
import { SeasonsSection } from "./sections/seasons";
import { BreakEvenSection } from "./sections/break-even";
import { DirectorsSection } from "./sections/directors";
import { ReportsSection } from "./sections/reports";
import { SettingsSection } from "./sections/settings";
import { ProfileSection } from "./sections/profile";
import { ChangePasswordSection } from "./sections/change-password";
import { AdminSection } from "./sections/admin";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Leaf } from "lucide-react";

export function DashboardShell() {
  const router = useRouter();
  const { section } = parseDashboardRoute(router.route);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeSection = section ?? "overview";

  const sectionElement = useMemo(() => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "tents":
        return <TentsSection />;
      case "strains":
        return <StrainsSection />;
      case "lights":
        return <LightsSection />;
      case "electricity":
        return <ElectricitySection />;
      case "nutrient-logs":
        return <NutrientLogsSection />;
      case "environment":
        return <EnvironmentSection />;
      case "expenses":
        return <ExpensesSection />;
      case "harvests":
        return <HarvestsSection />;
      case "revenue":
        return <RevenueSection />;
      case "seasons":
        return <SeasonsSection />;
      case "break-even":
        return <BreakEvenSection />;
      case "directors":
        return <DirectorsSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      case "profile":
        return <ProfileSection />;
      case "change-password":
        return <ChangePasswordSection />;
      case "admin":
        return <AdminSection />;
      default:
        return <OverviewSection />;
    }
  }, [activeSection]);

  const activeNav = NAV_ITEMS.find((n) => n.id === activeSection);

  const goTo = (id: string) => {
    router.navigate(
      id === "overview" ? "dashboard" : (`dashboard:${id}` as PageKey)
    );
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen flex cannabis-bg-dark">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarNav active={activeSection} onNavigate={goTo} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground">
          <SheetHeader className="p-4 border-b border-sidebar-border">
            <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
              <Leaf className="h-4 w-4" /> Kings Bud
            </SheetTitle>
          </SheetHeader>
          <SidebarNav active={activeSection} onNavigate={goTo} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={activeNav?.label ?? "Dashboard"}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {sectionElement}
        </main>
      </div>
    </div>
  );
}
