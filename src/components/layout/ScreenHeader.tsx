import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function ScreenHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 pt-safe", className)}>
      {subtitle && (
        <p className="mb-0.5 text-note-caption text-ink-muted">{subtitle}</p>
      )}
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-2 pb-1">
          {action}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
