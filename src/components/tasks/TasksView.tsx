"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Subject, Task } from "@prisma/client";

type TaskWithSubject = Task & {
  subject?: Subject | null;
  user?: { name: string } | null;
};

const tabs = ["All", "Incomplete", "Overdue", "Today", "Upcoming", "Completed"] as const;
type Tab = (typeof tabs)[number];

function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function TasksView({
  tasks,
  subjects,
  completionMap = new Map(),
}: {
  tasks: TaskWithSubject[];
  subjects: Subject[];
  completionMap?: Map<string, boolean>;
}) {
  const [tab, setTab] = useState<Tab>("All");
  const [open, setOpen] = useState(false);

  const filtered = tasks.filter((t) => {
    const isDone = completionMap.get(t.id) === true;
    if (tab === "All") return true;
    if (tab === "Incomplete") return !isDone;
    if (tab === "Completed") return isDone;
    const today = startOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tab === "Overdue") {
      // Past due and not yet completed — tasks without a deadline never count.
      return !isDone && !!t.deadline && t.deadline < today;
    }
    if (tab === "Today") {
      // Due today only (overdue has its own tab). Never tasks without a
      // deadline, and never already-done tasks.
      return !isDone && !!t.deadline && t.deadline >= today && t.deadline < tomorrow;
    }
    if (tab === "Upcoming") {
      return !isDone && !!t.deadline && t.deadline >= tomorrow;
    }
    return true;
  });

  return (
    <div>
      <ScreenHeader
        title="Tasks"
        subtitle={`${tasks.length} total`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        }
      />

      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
              tab === t
                ? "bg-primary text-white"
                : "bg-ink/5 text-ink-muted dark:bg-ink-inverse/10 dark:text-ink-inverse/70",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
          <AnimatePresence initial={false}>
            {filtered.map((t) => (
              <TaskCard key={t.id} task={t} href={`/tasks/${t.id}`} completionMap={completionMap} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={<Plus className="size-5" />}
          title="No tasks here"
          description="Create a task to keep your academic life on track."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New task
            </Button>
          }
        />
      )}

      {open && (
        <TaskFormModal open onClose={() => setOpen(false)} subjects={subjects} />
      )}
    </div>
  );
}
