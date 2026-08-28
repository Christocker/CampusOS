"use client";

import { useEffect } from "react";

export function SessionExpired() {
  useEffect(() => {
    window.location.href = "/signout";
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="card max-w-sm p-8">
        <h2 className="text-lg font-semibold">Session expired</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Redirecting to sign in...
        </p>
      </div>
    </div>
  );
}
