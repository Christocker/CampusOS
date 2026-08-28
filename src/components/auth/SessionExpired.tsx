"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SessionExpired() {
  const [clearing, setClearing] = useState(false);

  const handleSignOut = () => {
    setClearing(true);
    const raw = document.cookie;
    if (raw) {
      for (const pair of raw.split(";")) {
        const name = pair.split("=")[0]?.trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
        }
      }
    }
    window.location.replace("/login");
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="card max-w-sm p-8">
        <h2 className="text-lg font-semibold">Session expired</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your session is no longer valid. Please sign in again.
        </p>
        <Button
          onClick={handleSignOut}
          disabled={clearing}
          className="mt-6 w-full"
        >
          <LogIn className="size-4" /> {clearing ? "Signing out..." : "Sign in again"}
        </Button>
      </div>
    </div>
  );
}
