"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const TABLES = [
  "Task",
  "Subject",
  "CalendarEvent",
  "Group",
  "GroupMember",
  "UserEnrollment",
  "Comment",
  "InviteCode",
];

export function useRealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const channels = TABLES.map((table) =>
      supabase
        .channel(`realtime:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            router.refresh();
          },
        )
        .subscribe(),
    );

    return () => {
      for (const ch of channels) {
        supabase.removeChannel(ch);
      }
    };
  }, [router]);
}
