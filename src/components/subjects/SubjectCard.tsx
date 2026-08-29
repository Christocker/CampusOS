"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Check, Plus } from "lucide-react";
import { useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { enrollSubjectAction, unenrollSubjectAction } from "@/features/subjects/enrollmentActions";
import type { Subject } from "@prisma/client";

export function SubjectCard({
  subject,
  enrolled,
  canToggle = true,
  showIndicator = true,
}: {
  subject: Subject & { _count?: { tasks: number } };
  enrolled?: boolean;
  canToggle?: boolean;
  showIndicator?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const prevPending = useRef(isPending);

  useEffect(() => {
    if (prevPending.current && !isPending) {
      router.refresh();
    }
    prevPending.current = isPending;
  }, [isPending, router]);

  const toggleEnroll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canToggle) return;
    startTransition(() => {
      if (enrolled) {
        unenrollSubjectAction(subject.id);
      } else {
        enrollSubjectAction(subject.id);
      }
    });
  };

  return (
    <Link href={`/subjects/${subject.id}`}>
      <motion.div whileTap={{ scale: 0.99 }} className="flex items-center gap-3 px-4 py-3">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: subject.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-note-body font-medium">
            {(subject as Subject & { classCode?: string }).classCode
              ? `[${(subject as Subject & { classCode?: string }).classCode}] `
              : ""}{subject.name}
          </p>
          <p className="truncate text-note-caption text-ink-muted">
            {subject.professor ? `Prof. ${subject.professor}` : ""}
            {subject._count?.tasks ? `${subject.professor ? " · " : ""}${subject._count.tasks} tasks` : ""}
          </p>
        </div>
        {canToggle ? (
          <button
            onClick={toggleEnroll}
            disabled={isPending}
            className={`flex size-8 shrink-0 items-center justify-center rounded-full transition ${
              enrolled
                ? "bg-success/15 text-success hover:bg-success/25"
                : "bg-ink/5 text-ink-muted hover:bg-ink/10 dark:bg-ink-inverse/10 dark:hover:bg-ink-inverse/15"
            }`}
            aria-label={enrolled ? "Unenroll" : "Enroll"}
          >
            {isPending ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : enrolled ? (
              <Check className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
          </button>
        ) : showIndicator && enrolled ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="size-4" />
          </span>
        ) : null}
      </motion.div>
    </Link>
  );
}
