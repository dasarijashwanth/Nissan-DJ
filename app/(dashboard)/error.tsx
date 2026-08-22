"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-500/12">
        <AlertTriangle className="size-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-text-secondary">Something went wrong</p>
      <p className="max-w-xs text-sm text-text-muted">
        This page hit an unexpected error. You can try again, or head back to the dashboard.
      </p>
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </Card>
  );
}
