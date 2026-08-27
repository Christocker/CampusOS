import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-ink hover:bg-primary/90 active:bg-primary/80 shadow-sm",
  secondary:
    "bg-ink/5 text-ink hover:bg-ink/10 dark:bg-ink-inverse/10 dark:text-ink-inverse dark:hover:bg-ink-inverse/15",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 dark:text-ink-inverse dark:hover:bg-ink-inverse/10",
  soft: "bg-primary/15 text-ink hover:bg-primary/25",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-12 px-5 text-base",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}>(function Button({ variant, size, loading, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

import { Loader2 } from "lucide-react";
