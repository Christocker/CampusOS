"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

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
    const supabase = getSupabase();
    if (!supabase) return;

    const debouncedRefresh = () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => router.refresh(), 300);
    };

    // One channel with multiple subscriptions (Supabase connection limit is
    // per connection, not per channel — 9 channels was wasteful).
    let channel = supabase.channel("realtime:campusos");
    for (const table of TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        debouncedRefresh,
      );
    }
    channel.subscribe();

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [router]);
}
