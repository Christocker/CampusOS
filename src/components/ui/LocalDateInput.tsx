"use client";

import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";

const pad = (n: number) => String(n).padStart(2, "0");

function parts(d?: Date | null): { date: string; time: string } {
  if (!d) return { date: "", time: "" };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Date/time pickers whose defaultValue is derived from the browser's local
 * timezone. SSR renders them empty and they remount after hydration (via a
 * key swap), so server/client timezone differences never cause hydration
 * mismatches or wrong pre-filled values.
 */
export const LocalDateInput = forwardRef<
  HTMLInputElement,
  {
    name: string;
    value?: Date | null;
    className?: string;
    id?: string;
    required?: boolean;
    placeholder?: string;
  }
>(function LocalDateInput({ value, ...props }, ref) {
  const mounted = useMounted();
  return (
    <Input
      key={mounted ? `m-${value?.getTime?.() ?? "x"}` : "s"}
      type="date"
      ref={ref}
      defaultValue={mounted ? parts(value).date : ""}
      {...props}
    />
  );
});

export const LocalTimeInput = forwardRef<
  HTMLInputElement,
  {
    name: string;
    value?: Date | null;
    className?: string;
    id?: string;
    placeholder?: string;
  }
>(function LocalTimeInput({ value, ...props }, ref) {
  const mounted = useMounted();
  return (
    <Input
      key={mounted ? `m-${value?.getTime?.() ?? "x"}` : "s"}
      type="time"
      ref={ref}
      defaultValue={mounted ? parts(value).time : ""}
      {...props}
    />
  );
});
