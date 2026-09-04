"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TABLES = [
  "Task",
  "Subject",
  "UserEnrollment",
  "InviteCode",
  "CalendarEvent",
  "Comment",
  "TaskCompletion",
  "Group",
  "GroupMember",
];

export function useRealtimeRefresh() {
  const router = useRouter();
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const debouncedRefresh = () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => router.refresh(), 300);
    };

    // Load supabase-js lazily (keeps it out of the initial page bundle) and
    // only when realtime env vars are configured.
    import("@/lib/supabase/client")
      .then(({ getSupabase }) => {
        const supabase = getSupabase();
        if (!supabase || cancelled) return;

        // One channel with multiple subscriptions (was 9 separate channels).
        let ch = supabase.channel("realtime:campusos");
        for (const table of TABLES) {
          ch = ch.on(
            "postgres_changes",
            { event: "*", schema: "public", table },
            debouncedRefresh,
          );
        }
        ch.subscribe();
        cleanup = () => supabase.removeChannel(ch);
      })
      .catch(() => {
        // Realtime is a nice-to-have; never break the page if it fails.
      });

    return () => {
      cancelled = true;
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      cleanup?.();
    };
  }, [router]);
}
