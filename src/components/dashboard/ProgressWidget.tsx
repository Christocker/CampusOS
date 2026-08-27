import { cn } from "@/lib/utils";

export function ProgressWidget({
  value,
  total,
  completed,
  className,
}: {
  value: number;
  total: number;
  completed: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("card p-4", className)}>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-note-caption text-ink-muted">
          {completed} of {total} tasks done
        </p>
          <p className="text-note-headline text-ink">{pct}%</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
