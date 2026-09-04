"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Calendar as CalendarIcon,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSheet } from "./CreateSheet";
import type { Subject } from "@prisma/client";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/progress", label: "Progress", icon: Trophy },
];

export function BottomNav({ subjects }: { subjects: Subject[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 pt-safe">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 pb-2">
          <div className="glass flex w-full items-center justify-around rounded-3xl px-2 py-1.5">
            {items.slice(0, 2).map((it) => (
              <NavButton key={it.href} {...it} active={isActive(it.href)} />
            ))}

            <div className="relative mx-1 h-12 w-12">
              <CreateSheet subjects={subjects} />
            </div>

            {items.slice(2).map((it) => (
              <NavButton key={it.href} {...it} active={isActive(it.href)} />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function NavButton({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-medium"
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-2xl bg-primary/10"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
        />
      )}
      <Icon
        className={cn(
          "relative size-5 transition-colors",
          active ? "text-primary" : "text-ink-muted dark:text-ink-inverse/50",
        )}
      />
      <span
        className={cn(
          "relative transition-colors",
          active ? "text-primary" : "text-ink-muted dark:text-ink-inverse/50",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
