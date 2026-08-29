"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDeadline } from "@/lib/utils";
import { toggleTaskCompleteAction } from "@/features/tasks/actions";
import { PRIORITY, TASK_STATUS } from "@/lib/constants";
import type { Task, Subject } from "@prisma/client";

type TaskWithSubject = Task & {
  subject?: Subject | null;
  user?: { name: string } | null;
};

function TaskBody({
  task,
  completed,
  priority,
}: {
  task: TaskWithSubject;
  completed: boolean;
  priority: (typeof PRIORITY)[keyof typeof PRIORITY];
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className={cn("truncate text-note-body font-medium", completed && "text-ink-muted line-through")}>
        {task.title}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-note-caption text-ink-muted">
        {task.subject && (
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: task.subject.color }} />
            {task.subject.name}
          </span>
        )}
        {task.user && (
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-ink-muted/40" />
            {task.user.name.split(" ")[0]}
          </span>
        )}
        <span>{formatDeadline(task.deadline)}</span>
        {task.status !== "COMPLETED" && task.status !== "NOT_STARTED" && (
          <span style={{ color: TASK_STATUS[task.status].color }}>
            {TASK_STATUS[task.status].label}
          </span>
        )}
      </div>
    </div>
  );
}

export function TaskCard({ task, href }: { task: TaskWithSubject; href?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const prevPending = useRef(pending);
  const completed = task.status === "COMPLETED";
  const priority = PRIORITY[task.priority];

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
        onClick={() => start(async () => { await toggleTaskCompleteAction(task.id); router.refresh(); })}
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
          <TaskBody task={task} completed={completed} priority={priority} />
        </Link>
      ) : (
        <div className="min-w-0 flex-1">
          <TaskBody task={task} completed={completed} priority={priority} />
        </div>
      )}

      <span
        className={cn("size-2 shrink-0 rounded-full", priority.dot)}
        title={`${priority.label} priority`}
      />
    </motion.div>
  );
}
