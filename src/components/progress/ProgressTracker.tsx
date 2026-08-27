"use client";

import { useState } from "react";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { cn } from "@/lib/utils";

type Subject = { id: string; name: string; color: string; _count: { tasks: number } };
type User = { id: string; name: string; image: string | null };
type Task = { id: string; subjectId: string | null; userId: string; status: string };

export function ProgressTracker({
  subjects,
  users,
  tasks,
  currentUserId,
}: {
  subjects: Subject[];
  users: User[];
  tasks: Task[];
  currentUserId: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalTasks = tasks.length;
  const totalDone = tasks.filter((t) => t.status === "COMPLETED").length;

  const userStats = users.map((u) => {
    const userTasks = tasks.filter((t) => t.userId === u.id);
    const done = userTasks.filter((t) => t.status === "COMPLETED").length;
    return { ...u, total: userTasks.length, done, pct: userTasks.length ? Math.round((done / userTasks.length) * 100) : 0 };
  }).filter((u) => u.total > 0)
    .sort((a, b) => b.pct - a.pct || b.done - a.done);

  return (
    <div>
      <ScreenHeader title="Progress Tracker" subtitle={`${totalDone} of ${totalTasks} tasks done`} />

      <div className="card mb-4 p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-semibold">Overall</p>
          <p className="text-sm font-semibold text-primary">{totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0}%</p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${totalTasks ? (totalDone / totalTasks) * 100 : 0}%` }}
          />
        </div>
      </div>

      <h2 className="mb-3 text-base font-semibold">By user</h2>
      {userStats.length ? (
        <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
          {userStats.map((u, i) => (
            <div key={u.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  i === 0 ? "bg-primary text-ink" : "bg-ink/5 text-ink-muted dark:bg-ink-inverse/10",
                )}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {u.name}
                      {u.id === currentUserId && <span className="ml-1 text-xs text-primary">(you)</span>}
                    </p>
                  </div>
                  <p className="text-xs text-ink-muted">{u.done} of {u.total} tasks done</p>
                </div>
                <span className="text-sm font-semibold text-primary">{u.pct}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${u.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No tasks assigned yet.</p>
      )}

      {subjects.length > 0 && (
        <>
          <h2 className="mb-3 mt-6 text-base font-semibold">By subject</h2>
          <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
            {subjects.map((s) => {
              const subTasks = tasks.filter((t) => t.subjectId === s.id);
              const subDone = subTasks.filter((t) => t.status === "COMPLETED").length;
              const isOpen = expanded === s.id;

              return (
                <div key={s.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-ink-muted">{subDone} of {subTasks.length} done</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {subTasks.length ? Math.round((subDone / subTasks.length) * 100) : 0}%
                    </span>
                    {isOpen ? <ChevronUp className="size-4 text-ink-muted" /> : <ChevronDown className="size-4 text-ink-muted" />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-border-light bg-ink/[0.02] px-4 py-2 dark:border-border-dark dark:bg-ink-inverse/[0.02]">
                      {users.map((u) => {
                        const ut = subTasks.filter((t) => t.userId === u.id);
                        const ud = ut.filter((t) => t.status === "COMPLETED").length;
                        if (ut.length === 0) return null;
                        return (
                          <div key={u.id} className="flex items-center gap-2 py-1.5">
                            <span className="flex-1 truncate text-xs text-ink-muted">
                              {u.name}
                              {u.id === currentUserId && <span className="ml-1 text-primary">(you)</span>}
                            </span>
                            <span className="text-xs font-medium">{ud}/{ut.length}</span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${ut.length ? (ud / ut.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
