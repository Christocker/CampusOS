"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SessionExpired() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="card max-w-sm p-8">
        <h2 className="text-lg font-semibold">Session expired</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your session is no longer valid. Please sign in again.
        </p>
        <a href="/signout">
          <Button className="mt-6 w-full">
            <LogIn className="size-4" /> Sign in again
          </Button>
        </a>
      </div>
    </div>
  );
}
