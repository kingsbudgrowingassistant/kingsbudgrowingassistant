"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  extra?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionLoading,
  extra,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        {actionLabel && onAction && (
          <Button onClick={onAction} disabled={actionLoading} size="sm">
            {actionLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> {actionLabel}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
