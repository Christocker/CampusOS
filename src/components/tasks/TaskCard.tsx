"use client";

import Link from "next/link";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useTransition, useEffect, useState } from "react";
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
      <div className="mt-0.5 flex items-center gap-x-2 text-note-caption text-ink-muted">
        {task.subject && (
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: task.subject.color }} />
            {task.subject.name}
          </span>
        )}
        <span>{formatDeadline(task.deadline)}</span>
      </div>
    </div>
  );
}

export function TaskCard({ task, href, completionMap }: { task: TaskWithSubject; href?: string; completionMap?: Map<string, boolean> }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const serverCompleted = completionMap?.get(task.id) ?? false;
  // Optimistic override flips instantly; cleared once the server value agrees.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const completed = optimistic ?? serverCompleted;

  useEffect(() => {
    if (optimistic !== null && optimistic === serverCompleted) {
      setOptimistic(null);
    }
  }, [optimistic, serverCompleted]);

  const toggle = () => {
    const next = !completed;
    setOptimistic(next);
    start(async () => {
      const res = await toggleTaskCompleteAction(task.id);
      if (res?.error) {
        setOptimistic(null); // revert to server truth
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
    >
      <button
        onClick={toggle}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        aria-pressed={completed}
        className={cn(
          "relative flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
          completed
            ? "border-success bg-success text-white"
            : "border-separator-light dark:border-separator-dark",
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: completed ? 1 : 0, opacity: completed ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </motion.span>
        {pending && (
          <span className="absolute size-6 animate-ping rounded-full bg-success/30" />
        )}
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
    </div>
  );
}
