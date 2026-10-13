"use client";

import { useCallback, useEffect, useState } from "react";

type Route = string;

const PAGES = [
  "landing",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "dashboard",
] as const;

export type PageKey = (typeof PAGES)[number] | `dashboard:${string}`;

function parseHash(hash: string): PageKey {
  const clean = hash.replace(/^#\/?/, "").trim();
  if (!clean) return "landing";
  if (clean === "dashboard") return "dashboard";
  if (clean.startsWith("dashboard/")) {
    return `dashboard:${clean.slice("dashboard/".length)}` as PageKey;
  }
  if ((PAGES as readonly string[]).includes(clean)) return clean as PageKey;
  return "landing";
}

export function useRouter() {
  const [route, setRoute] = useState<PageKey>(() =>
    parseHash(typeof window !== "undefined" ? window.location.hash : "")
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((to: PageKey | string) => {
    const target = typeof to === "string" ? (to as PageKey) : to;
    if (target.startsWith("dashboard:")) {
      window.location.hash = `#/dashboard/${target.slice("dashboard:".length)}`;
    } else if (target === "dashboard") {
      window.location.hash = "#/dashboard";
    } else {
      window.location.hash = `#/${target}`;
    }
    // hashchange event will fire and update state.
  }, []);

  return { route, navigate };
}

export function parseDashboardRoute(route: PageKey): { section: string | null } {
  if (route === "dashboard") return { section: "overview" };
  if (route.startsWith("dashboard:")) {
    return { section: route.slice("dashboard:".length) };
  }
  return { section: null };
}
