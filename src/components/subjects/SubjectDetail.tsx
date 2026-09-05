"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Check, Plus } from "lucide-react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { SubjectFormModal } from "@/components/subjects/SubjectFormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { deleteSubjectAction } from "@/features/subjects/actions";
import {
  enrollSubjectAction,
  unenrollSubjectAction,
} from "@/features/subjects/enrollmentActions";
import type { Subject, Task } from "@prisma/client";

type TaskWithSubject = Task & { subject?: Subject | null };

export function SubjectDetail({
  subject,
  tasks,
  completionMap = new Map(),
  isOwner,
  enrolled,
}: {
  subject: Subject;
  tasks: TaskWithSubject[];
  completionMap?: Map<string, boolean>;
  isOwner: boolean;
  enrolled: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [enrollPending, startEnroll] = useTransition();
  const router = useRouter();

  const toggleEnroll = () => {
    startEnroll(async () => {
      if (enrolled) {
        await unenrollSubjectAction(subject.id);
      } else {
        await enrollSubjectAction(subject.id);
      }
      router.refresh();
    });
  };

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
            disabled={enrollPending}
            onClick={toggleEnroll}
            className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 text-xs font-medium text-ink disabled:opacity-60 dark:bg-ink-inverse/10 dark:text-ink-inverse"
            aria-label={enrolled ? "Unenroll" : "Enroll"}
          >
            {enrollPending ? (
              <Spinner className="size-3.5" />
            ) : enrolled ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {enrollPending ? "Saving…" : enrolled ? "Enrolled" : "Enroll"}
          </button>
          {isOwner && (
            <button
              onClick={() => setEditOpen(true)}
              className="flex size-10 items-center justify-center rounded-full bg-ink/5 text-ink dark:bg-ink-inverse/10 dark:text-ink-inverse"
              aria-label="Edit"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {isOwner && (
            <button
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete this subject and all its tasks?")) return;
                start(async () => {
                  const res = await deleteSubjectAction(subject.id);
                  if (res?.error) {
                    alert(res.error);
                    return;
                  }
                  router.push("/subjects");
                });
              }}
              className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger"
              aria-label="Delete"
            >
              {pending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          )}
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
            <TaskCard key={t.id} task={t} href={`/tasks/${t.id}`} completionMap={completionMap} />
          ))}
        </div>
      ) : (
        <EmptyState title="No tasks yet" description="Add a task for this subject." />
      )}

      {editOpen && (
        <SubjectFormModal open onClose={() => setEditOpen(false)} subject={subject} />
      )}
    </div>
  );
}
