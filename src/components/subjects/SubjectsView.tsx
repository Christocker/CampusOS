"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SubjectCard } from "@/components/subjects/SubjectCard";
import { SubjectFormModal } from "@/components/subjects/SubjectFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Subject } from "@prisma/client";

type SubjectWithCount = Subject & { _count?: { tasks: number } };

export function SubjectsView({
  subjects,
  enrolledIds,
  currentUserId,
}: {
  subjects: SubjectWithCount[];
  enrolledIds: string[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState<"enrolled" | "all">("enrolled");

  const enrolled = subjects.filter((s) => enrolledIds.includes(s.id));
  const display = show === "enrolled" ? enrolled : subjects;

  return (
    <div>
      <ScreenHeader
        title="Subjects"
        subtitle={`${enrolled.length} enrolled`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        }
      />

      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        {(["enrolled", "all"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setShow(v)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              show === v
                ? "bg-primary text-ink"
                : "bg-ink/5 text-ink-muted dark:bg-ink-inverse/10 dark:text-ink-inverse/70"
            }`}
          >
            {v === "enrolled" ? `Enrolled (${enrolled.length})` : `All (${subjects.length})`}
          </button>
        ))}
      </div>

      {display.length ? (
        <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
          {display.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              enrolled={enrolledIds.includes(s.id)}
              isOwner={s.userId === currentUserId}
            />
          ))}
        </div>
      ) : show === "enrolled" ? (
        <EmptyState
          icon={<Plus className="size-5" />}
          title="No subjects enrolled"
          description="Browse all subjects and enroll in the ones you're taking."
          action={
            <Button size="sm" onClick={() => setShow("all")}>
              Browse subjects
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Plus className="size-5" />}
          title="No subjects yet"
          description="Add a subject to get started."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Add subject
            </Button>
          }
        />
      )}

      {open && <SubjectFormModal open onClose={() => setOpen(false)} />}
    </div>
  );
}
