"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

function isStaleBuildError(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("chunk") ||
    lower.includes("dynamically imported module") ||
    lower.includes("loading css chunk") ||
    lower.includes("failed to fetch dynamically imported module")
  );
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isStaleBuildError(error)) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-[24px] font-bold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-note-body text-ink-muted">
        The page failed to load correctly. This is usually temporary.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => reset()}>
          Try again
        </Button>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </div>
  );
}
