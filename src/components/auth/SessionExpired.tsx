"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SessionExpired() {
  const [clearing, setClearing] = useState(false);

  const handleSignOut = () => {
    setClearing(true);
    // Delete ALL cookies for this domain
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
    }
    // Force hard navigation to login
    window.location.href = "/login";
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
