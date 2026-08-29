"use client";

import { useState, useActionState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Send } from "lucide-react";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { TASK_STATUS, PRIORITY } from "@/lib/constants";
import { formatDeadline } from "@/lib/utils";
import { deleteTaskAction } from "@/features/tasks/actions";
import { addCommentAction } from "@/features/groups/actions";
import type { ActionState } from "@/features/shared/validations";
import type { Subject, Task, Comment, User } from "@prisma/client";

type FullTask = Task & {
  subject?: Subject | null;
  comments: (Comment & { author: Pick<User, "id" | "name" | "image"> })[];
};

export function TaskDetail({
  task,
  subjects,
}: {
  task: FullTask;
  subjects: Subject[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const prevPending = useRef(pending);
  const commentState: ActionState = {};
  const [cState, cAction, cPending] = useActionState(addCommentAction, commentState);

  useEffect(() => {
    if (prevPending.current && !pending) {
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, router]);

  useEffect(() => {
    if (cState.ok) router.refresh();
  }, [cState.ok, router]);

  const status = TASK_STATUS[task.status];
  const priority = PRIORITY[task.priority];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/tasks"
          className="flex size-9 items-center justify-center rounded-full bg-ink/5 text-ink dark:bg-ink-inverse/10 dark:text-ink-inverse"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex gap-1">
          <button
            onClick={() => setEditOpen(true)}
            className="flex size-9 items-center justify-center rounded-full bg-ink/5 text-ink dark:bg-ink-inverse/10 dark:text-ink-inverse"
            aria-label="Edit"
          >
            <Pencil className="size-4" />
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this task?")) return;
              start(async () => {
                await deleteTaskAction(task.id);
                router.replace("/tasks");
                router.refresh();
              });
            }}
            className="flex size-9 items-center justify-center rounded-full bg-danger/10 text-danger"
            aria-label="Delete"
          >
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        </div>
      </div>

      <h1 className="text-[28px] font-bold tracking-tight leading-tight">{task.title}</h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge className={status.bg} style={{ color: status.color }}>
          {status.label}
        </Badge>
        <Badge className="bg-ink/5 dark:bg-ink-inverse/10">
          <span className={`size-2 rounded-full ${priority.dot}`} /> {priority.label}
        </Badge>
        {task.subject && (
          <Badge className="bg-ink/5 dark:bg-ink-inverse/10">
            <span className="size-2 rounded-full" style={{ backgroundColor: task.subject.color }} />
            {task.subject.name}
          </Badge>
        )}
      </div>

      <dl className="mt-4 space-y-3 text-note-body">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Due</dt>
          <dd className="font-medium">{formatDeadline(task.deadline)}</dd>
        </div>
        {task.description && (
          <div>
            <dt className="mb-1 text-ink-muted">Description</dt>
            <dd className="whitespace-pre-wrap text-ink/90 dark:text-ink-inverse/90">
              {task.description}
            </dd>
          </div>
        )}
      </dl>

      <div className="my-6 h-px bg-border-light dark:bg-border-dark" />

      <h2 className="mb-3 text-note-headline">Comments</h2>
      {task.comments.length ? (
        <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
          {task.comments.map((c) => (
            <div key={c.id} className="px-4 py-3">
              <p className="text-note-caption font-medium text-ink-muted">{c.author.name}</p>
              <p className="mt-0.5 text-note-body">{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-note-caption text-ink-muted">No comments yet.</p>
      )}

      <form action={cAction} className="mt-4 space-y-2">
        <input type="hidden" name="taskId" value={task.id} />
        <Label htmlFor="content">Add a comment</Label>
        <Textarea id="content" name="content" placeholder="Write something…" autoCapitalize="characters" />
        {cState.error && <p className="text-note-caption text-danger">{cState.error}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={cPending}>
            <Send className="size-4" /> Comment
          </Button>
        </div>
      </form>

      <TaskFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        subjects={subjects}
        task={task}
      />
    </div>
  );
}
