"use client";

import { useRouter, type PageKey } from "@/lib/router";
import {
  LayoutDashboard,
  Tent as TentIcon,
  Lightbulb,
  Zap,
  Receipt,
  Sprout,
  DollarSign,
  CalendarDays,
  Scale,
  Users,
  FileBarChart,
  Settings as SettingsIcon,
  User,
  KeyRound,
  Leaf,
  LogOut,
  Dna,
  ShieldCheck,
  Beaker,
  Thermometer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: "main" | "analysis" | "account" | "admin";
}

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { id: "tents", label: "Tents", icon: TentIcon, group: "main" },
  { id: "strains", label: "Strains", icon: Dna, group: "main" },
  { id: "lights", label: "Lights", icon: Lightbulb, group: "main" },
  { id: "electricity", label: "Electricity", icon: Zap, group: "main" },
  { id: "environment", label: "Environment", icon: Thermometer, group: "main" },
  { id: "nutrient-logs", label: "Nutrient Logs", icon: Beaker, group: "main" },
  { id: "expenses", label: "Expenses", icon: Receipt, group: "main" },
  { id: "harvests", label: "Harvests", icon: Sprout, group: "main" },
  { id: "revenue", label: "Revenue", icon: DollarSign, group: "main" },
  { id: "seasons", label: "Seasons", icon: CalendarDays, group: "main" },
  { id: "break-even", label: "Break-Even", icon: Scale, group: "analysis" },
  { id: "directors", label: "Company & Directors", icon: Users, group: "analysis" },
  { id: "reports", label: "Reports", icon: FileBarChart, group: "analysis" },
  { id: "settings", label: "Settings", icon: SettingsIcon, group: "account" },
  { id: "profile", label: "Profile", icon: User, group: "account" },
  { id: "change-password", label: "Change Password", icon: KeyRound, group: "account" },
  { id: "admin", label: "Admin Panel", icon: ShieldCheck, group: "admin" },
];

interface SidebarNavProps {
  active: string;
  onNavigate: (id: string) => void;
}

export function SidebarNav({ active, onNavigate }: SidebarNavProps) {
  const { signOut, profile, isAdmin } = useAuth();
  const router = useRouter();

  const groups: { title: string; items: NavItem[] }[] = [
    { title: "Operations", items: NAV_ITEMS.filter((i) => i.group === "main") },
    { title: "Analysis", items: NAV_ITEMS.filter((i) => i.group === "analysis") },
    { title: "Account", items: NAV_ITEMS.filter((i) => i.group === "account") },
    ...(isAdmin
      ? [{ title: "Admin", items: NAV_ITEMS.filter((i) => i.group === "admin") }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base text-sidebar-foreground">
              Kings Bud
            </div>
            <div className="text-[11px] text-sidebar-foreground/70 -mt-0.5">
              Grow Assistant
            </div>
          </div>
        </div>
        {profile?.business_name && (
          <div className="mt-3 text-xs px-2 py-1.5 rounded-md bg-sidebar-accent text-sidebar-accent-foreground truncate">
            {profile.business_name}
          </div>
        )}
        {isAdmin && (
          <div className="mt-2 text-[10px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Owner / Admin
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/60">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors text-left",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={async () => {
            await signOut();
            router.navigate("landing");
          }}
        >
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );
}

export type { PageKey };
