"use client";

import Link from "next/link";

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
  const prevPending = useRef(pending);
  const completed = completionMap?.get(task.id) ?? false;

  useEffect(() => {
    if (prevPending.current && !pending) {
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, router]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
    >
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await toggleTaskCompleteAction(task.id);
            if (res?.error) alert(res.error);
          })
        }
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition",
          completed
            ? "border-success bg-success text-white"
            : "border-separator-light dark:border-separator-dark",
        )}
      >
        {pending ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Check className="size-3.5" strokeWidth={3} />
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
