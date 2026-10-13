"use client";

import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

export function ConfigureSupabaseInline() {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 cannabis-bg-dark">
      <Card className="max-w-lg w-full">
        <CardContent className="p-6 space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="font-semibold text-base">
                Supabase not configured
              </h1>
              <p className="text-xs text-muted-foreground">
                Auth pages require a live Supabase project.
              </p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Follow the deployment guide in{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-xs">
              DEPLOYMENT.md
            </code>{" "}
            to set{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-xs">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            environment variables. Authentication, multi-device sync, and data
            persistence are unavailable until then.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("landing")}>
            Back to landing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
