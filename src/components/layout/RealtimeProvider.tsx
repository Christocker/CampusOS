"use client";

import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeRefresh();
  return <>{children}</>;
}
