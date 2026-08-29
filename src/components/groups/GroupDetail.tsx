"use client";

import { useState, useActionState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, UserPlus, LogOut, Trash2, Crown } from "lucide-react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { GroupTaskFormModal } from "@/components/groups/GroupTaskFormModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { initials } from "@/lib/utils";
import {
  addMemberAction,
  removeMemberAction,
  leaveGroupAction,
  deleteGroupAction,
} from "@/features/groups/actions";
import type { ActionState } from "@/features/shared/validations";
import type { Subject, Task, Group } from "@prisma/client";

type Member = {
  id: string;
  role: "MEMBER" | "ADMIN";
  user: { id: string; name: string };
};

type TaskWithSubject = Task & { subject?: Subject | null };

export function GroupDetail({
  group,
  members,
  tasks,
  isOwner,
  subjects,
}: {
  group: Group;
  members: Member[];
  tasks: TaskWithSubject[];
  isOwner: boolean;
  subjects: Subject[];
}) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [mState, mAction, mPending] = useActionState(
    addMemberAction.bind(null, group.id),
    {} as ActionState,
  );
  const [pending, start] = useTransition();
  const router = useRouter();
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending) {
      router.refresh();
    }
    prevPending.current = pending;
  }, [pending, router]);

  useEffect(() => {
    if (mState.ok) router.refresh();
  }, [mState.ok, router]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/groups"
          className="flex size-10 items-center justify-center rounded-full bg-ink/5 text-ink dark:bg-ink-inverse/10 dark:text-ink-inverse"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {isOwner ? (
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this group and all its data?")) return;
              start(async () => { await deleteGroupAction(group.id); router.push("/groups"); });
            }}
            className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger"
            aria-label="Delete group"
          >
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        ) : (
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm("Leave this group?")) return;
              start(async () => { await leaveGroupAction(group.id); router.push("/groups"); });
            }}
            className="flex size-10 items-center justify-center rounded-full bg-ink/5 text-ink-muted dark:bg-ink-inverse/10"
            aria-label="Leave group"
          >
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <LogOut className="size-4" />
            )}
          </button>
        )}
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
      {group.description && (
        <p className="mt-1 text-sm text-ink-muted">{group.description}</p>
      )}

      <div className="mt-5">
        <h2 className="mb-2 text-base font-semibold">Members</h2>
        <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials(m.user.name)}
              </span>
              <span className="flex-1 truncate text-note-body font-medium">{m.user.name}</span>
              {m.role === "ADMIN" && <Crown className="size-4 text-warning" />}
              {isOwner && m.user.id !== members.find((x) => x.role === "ADMIN")?.user.id && (
                <button
                  onClick={() => start(async () => { await removeMemberAction(group.id, m.user.id); router.refresh(); })}
                  className="text-note-caption font-medium text-danger"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {isOwner && (
          <form action={mAction} className="mt-2 flex gap-2">
            <Input name="email" type="email" placeholder="Add by email…" />
            <Button type="submit" loading={mPending} size="md">
              <UserPlus className="size-4" />
            </Button>
          </form>
        )}
        {mState.error && <p className="mt-1 text-xs text-danger">{mState.error}</p>}
        {mState.ok && <p className="mt-1 text-xs text-success">Member added.</p>}
      </div>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-base font-semibold">Shared tasks</h2>
        <Button size="sm" onClick={() => setTaskOpen(true)}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
      {tasks.length ? (
        <div className="space-y-2.5">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} href={`/tasks/${t.id}`} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No shared tasks yet.</p>
      )}

      <GroupTaskFormModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        groupId={group.id}
        subjects={subjects}
      />
    </div>
  );
}
