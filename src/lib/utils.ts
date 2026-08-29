import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date as e.g. "Today 11:59 PM" / "Friday" / "Mar 14". Time only shown if explicitly set (not default 23:59). */
export function formatDeadline(date: Date | string | null | undefined): string {
  if (!date) return "No deadline";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const hasExplicitTime = !(d.getHours() === 23 && d.getMinutes() === 59);
  const time = hasExplicitTime
    ? ` ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : "";

  if (isToday) return `Today${time}`;
  if (isTomorrow) return `Tomorrow${time}`;
  const day = d.toLocaleDateString(undefined, { weekday: "long" });
  return `${day}${time}`;
}

/** Short date label e.g. "Mar 14". */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Returns true if a deadline is within the next `days` days. */
export function isUpcoming(date: Date | string | null | undefined, days = 7): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
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
