"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { SubjectFormModal } from "@/components/subjects/SubjectFormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteSubjectAction } from "@/features/subjects/actions";
import type { Subject, Task } from "@prisma/client";

type TaskWithSubject = Task & { subject?: Subject | null };

export function SubjectDetail({
  subject,
  tasks,
  subjects,
}: {
  subject: Subject;
  tasks: TaskWithSubject[];
  subjects: Subject[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/subjects"
          className="flex size-10 items-center justify-center rounded-full bg-ink/5 text-ink dark:bg-ink-inverse/10 dark:text-ink-inverse"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="flex size-10 items-center justify-center rounded-full bg-ink/5 text-ink dark:bg-ink-inverse/10 dark:text-ink-inverse"
            aria-label="Edit"
          >
            <Pencil className="size-4" />
          </button>
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await deleteSubjectAction(subject.id);
                router.push("/subjects");
              })
            }
            className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger"
            aria-label="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          <h1 className="text-[28px] font-bold tracking-tight">{subject.name}</h1>
        </div>
        <p className="mt-1 text-note-caption text-ink-muted">
          {subject.professor ? `Prof. ${subject.professor}` : "No professor"}
          {subject.semester ? ` · ${subject.semester}` : ""}
        </p>
        {subject.description && (
          <p className="mt-3 whitespace-pre-wrap text-note-body text-ink/80 dark:text-ink-inverse/80">
            {subject.description}
          </p>
        )}
      </div>

      <h2 className="mb-3 mt-6 text-note-headline">Tasks</h2>
      {tasks.length ? (
        <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} href={`/tasks/${t.id}`} />
          ))}
        </div>
      ) : (
        <EmptyState title="No tasks yet" description="Add a task for this subject." />
      )}

      <SubjectFormModal open={editOpen} onClose={() => setEditOpen(false)} subject={subject} />
    </div>
  );
}
