"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, type PageKey } from "@/lib/router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User, Settings, KeyRound, Bell, Zap } from "lucide-react";
import { useData } from "@/lib/data-context";
import { computeDashboardKpis } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user, profile, signOut, refreshingProfile } = useAuth();
  const data = useData();
  const router = useRouter();

  const kpis = computeDashboardKpis({
    tents: data.tents,
    lights: data.lights,
    electricity: data.electricity,
    expenses: data.expenses,
    harvests: data.harvests,
    sales: data.sales,
    settings: data.settings,
    directors: data.directors,
  });

  const initials = (profile?.full_name || user?.email || "U")
    .split(/\s+|@/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>

        {/* Quick stats — hidden on small screens */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="px-2.5 py-1 rounded-md bg-muted">
            <span className="text-muted-foreground">Monthly kWh: </span>
            <span className="font-semibold">
              {kpis.totalMonthlyKwh.toFixed(0)}
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-muted">
            <span className="text-muted-foreground">Overheads: </span>
            <span className="font-semibold">
              {formatCurrency(
                kpis.monthlyOverheads,
                data.settings?.currency
              )}
            </span>
          </div>
          <div
            className={`px-2.5 py-1 rounded-md ${
              kpis.grossProfit >= 0 ? "bg-primary/10" : "bg-destructive/10"
            }`}
          >
            <span
              className={
                kpis.grossProfit >= 0 ? "text-primary" : "text-destructive"
              }
            >
              {kpis.grossProfit >= 0 ? "Profit: " : "Loss: "}
            </span>
            <span className="font-semibold">
              {formatCurrency(kpis.grossProfit, data.settings?.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Realtime sync indicator */}
          <div
            className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"
            title="Realtime sync active"
          >
            <Zap className="h-3 w-3 text-primary" />
            <span>Live</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 pl-1.5 pr-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-sm font-medium truncate max-w-[140px]">
                    {profile?.full_name ?? "User"}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate max-w-[140px]">
                    {profile?.email ?? user?.email}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="leading-tight">
                <div className="font-semibold">{profile?.full_name ?? "User"}</div>
                <div className="text-xs text-muted-foreground font-normal truncate">
                  {profile?.email ?? user?.email}
                </div>
                {profile?.business_name && (
                  <div className="text-xs text-primary font-medium mt-0.5 truncate">
                    {profile.business_name}
                  </div>
                )}
                {refreshingProfile && (
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Syncing profile…
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.navigate("dashboard:profile" as PageKey)}>
                <User className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.navigate("dashboard:settings" as PageKey)}>
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.navigate("dashboard:change-password" as PageKey)}>
                <KeyRound className="h-4 w-4" /> Change password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  router.navigate("landing");
                }}
              >
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
