"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const TABLES = ["Task", "Subject", "UserEnrollment", "InviteCode"];

export function useRealtimeRefresh() {
  const router = useRouter();
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const debouncedRefresh = () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => router.refresh(), 300);
    };

    const channels = TABLES.map((table) =>
      supabase
        .channel(`realtime:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          debouncedRefresh,
        )
        .subscribe(),
    );

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      for (const ch of channels) {
        supabase.removeChannel(ch);
      }
    };
  }, [router]);
}
