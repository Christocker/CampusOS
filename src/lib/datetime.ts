/**
 * Wall-clock -> exact instant conversion shared by task and calendar forms.
 *
 * Date/time inputs are "YYYY-MM-DD" + optional "HH:mm" picked in the user's
 * browser. The form also submits the browser's UTC offset (minutes, with the
 * same semantics as Date#getTimezoneOffset), which lets the server compute the
 * correct absolute instant regardless of the server's own timezone.
 */
export function parseWallClock(
  dateStr: unknown,
  timeStr: unknown,
  tzOffsetRaw: unknown,
  defaultTime: "end-of-day" | "start-of-day" = "start-of-day",
): Date | null {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const [y, mo, d] = dateStr.split("-").map(Number) as [number, number, number];
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }

  let h: number;
  let mi: number;
  if (typeof timeStr === "string" && timeStr !== "") {
    const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
    if (!m) return null;
    h = Number(m[1]);
    mi = Number(m[2]);
  } else {
    h = defaultTime === "end-of-day" ? 23 : 0;
    mi = defaultTime === "end-of-day" ? 59 : 0;
  }

  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;

  let off = 0;
  const n = Number(tzOffsetRaw);
  if (Number.isFinite(n)) off = Math.max(-840, Math.min(840, n));

  const result = new Date(Date.UTC(y, mo - 1, d, h, mi) + off * 60_000);
  // Reject impossible dates like Feb 30 / Apr 31 (Date.UTC would silently
  // roll them over to the next month).
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d ||
    Number.isNaN(result.getTime())
  ) {
    return null;
  }
  return result;
}

/**
 * Same conversion for an HTML `datetime-local` value ("YYYY-MM-DDTHH:mm"),
 * which carries no timezone information.
 */
export function parseLocalIso(
  iso: unknown,
  tzOffsetRaw: unknown,
  defaultTime: "end-of-day" | "start-of-day" = "start-of-day",
): Date | null {
  if (typeof iso !== "string" || iso === "") return null;
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})/.exec(iso);
  if (m) {
    return parseWallClock(m[1], `${m[2]}:${m[3]}`, tzOffsetRaw, defaultTime);
  }
  // Date-only datetime-local value.
  return parseWallClock(iso, "", tzOffsetRaw, defaultTime);
}

/**
 * Sentinel clock time for a "date only" (no time chosen) value. Noon UTC keeps
 * the calendar date stable across every practical timezone, and the extra
 * millisecond guarantees it can never collide with a real timestamp — timed
 * values produced by `parseWallClock` always have zero seconds and
 * milliseconds.
 */
const DATE_ONLY_HOURS = 12;
const DATE_ONLY_MS = 1;

/**
 * A deadline the user picked without a time. Stored as a timezone-independent
 * instant so it renders as the exact same calendar date for everyone, and
 * `formatDeadline` never shows a time for it.
 */
export function makeDateOnly(dateStr: unknown): Date | null {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const [y, mo, d] = dateStr.split("-").map(Number) as [number, number, number];
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  // Reject impossible dates like Feb 30 / Apr 31.
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return new Date(Date.UTC(y, mo - 1, d, DATE_ONLY_HOURS, 0, 0, DATE_ONLY_MS));
}

/** True when a value was stored via `makeDateOnly` (i.e. no time was chosen). */
export function isDateOnly(value: Date | string | null | undefined): boolean {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getUTCHours() === DATE_ONLY_HOURS &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === DATE_ONLY_MS
  );
}

