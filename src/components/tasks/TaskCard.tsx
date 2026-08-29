"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDeadline } from "@/lib/utils";
import { toggleTaskCompleteAction } from "@/features/tasks/actions";
import { PRIORITY } from "@/lib/constants";
import type { Task, Subject } from "@prisma/client";

type TaskWithSubject = Task & {
  subject?: Subject | null;
};

function TaskBody({
  task,
  completed,
}: {
  task: TaskWithSubject;
  completed: boolean;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className={cn("truncate text-note-body font-medium", completed && "text-ink-muted line-through")}>
        {task.title}
      </p>
      <p className="mt-0.5 text-note-caption text-ink-muted">
        {formatDeadline(task.deadline)}
      </p>
    </div>
  );
}

export function TaskCard({ task, href }: { task: TaskWithSubject; href?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const prevPending = useRef(pending);
  const completed = task.status === "COMPLETED";

  useEffect(() => {
    if (prevPending.current && !pending) {
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, router]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-3"
    >
      <button
        disabled={pending}
        onClick={() => start(() => toggleTaskCompleteAction(task.id))}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition",
          completed
            ? "border-success bg-success text-white"
            : "border-separator-light dark:border-separator-dark",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>

      {href ? (
        <Link href={href} className="min-w-0 flex-1">
          <TaskBody task={task} completed={completed} />
        </Link>
      ) : (
        <div className="min-w-0 flex-1">
          <TaskBody task={task} completed={completed} />
        </div>
      )}

      <span
        className={cn("size-2 shrink-0 rounded-full", PRIORITY[task.priority].dot)}
        title={`${PRIORITY[task.priority].label} priority`}
      />
    </motion.div>
  );
}
