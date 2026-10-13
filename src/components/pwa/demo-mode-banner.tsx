"use client";

import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoModeBannerProps {
  onExit: () => void;
}

export function DemoModeBanner({ onExit }: DemoModeBannerProps) {
  return (
    <div className="bg-amber-100 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-900 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Demo Mode</strong> — you are viewing the dashboard with
          sample data. Writes are disabled. Connect Supabase for production.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onExit}
        className="shrink-0 h-7 text-xs border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900"
      >
        <X className="h-3 w-3" /> Exit demo
      </Button>
    </div>
  );
}
