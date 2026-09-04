import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Coerce a Date | string into a Date without the classic UTC-shift bug:
 * date-only strings like "2026-09-05" are parsed as LOCAL midnight,
 * not UTC midnight.
 */
function toDate(value: Date | string): Date {
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    return new Date(value);
  }
  return value;
}

/** Format a date as e.g. "Today 11:59 PM" / "Tomorrow" / "Mon, Aug 27". Time only shown if explicitly set. */
export function formatDeadline(date: Date | string | null | undefined): string {
  if (!date) return "No deadline";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "No deadline";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  // 00:00 means "no explicit time"; 23:59 is the end-of-day default for
  // date-only deadlines and is also treated as implicit.
  const hasExplicitTime =
    !(d.getHours() === 0 && d.getMinutes() === 0) &&
    !(d.getHours() === 23 && d.getMinutes() === 59);
  const time = hasExplicitTime
    ? ` ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : "";

  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  if (isToday) return `Today${time}`;
  if (isTomorrow) return `Tomorrow${time}`;
  return `${dateStr}${time}`;
}

/** Short date label e.g. "Mar 14". */
export function formatShortDate(date: Date | string): string {
  const d = toDate(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Returns true if a deadline is within the next `days` days. */
export function isUpcoming(date: Date | string | null | undefined, days = 7): boolean {
  if (!date) return false;
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(now.getDate() + days);
  return d >= now && d <= horizon;
}

/** Time-of-day greeting. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
