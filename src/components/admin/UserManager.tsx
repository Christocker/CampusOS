"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Shield, User } from "lucide-react";
import { deleteUserAction, changeUserRoleAction } from "@/features/admin/actions";
import { initials } from "@/lib/utils";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
};

function Row({
  u,
  currentUserId,
}: {
  u: ManagedUser;
  currentUserId: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const isSelf = u.id === currentUserId;

  const toggleRole = () => {
    const next = u.role === "ADMIN" ? "STUDENT" : "ADMIN";
    if (
      !confirm(
        `Change ${u.name}'s role to ${next}? They ${next === "ADMIN" ? "will get" : "will lose"} admin access.`,
      )
    )
      return;
    start(async () => {
      const res = await changeUserRoleAction(u.id, next);
      if (res?.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  const remove = () => {
    if (
      !confirm(
        `Delete ${u.name}? Their subjects, tasks and groups they own will be permanently removed.`,
      )
    )
      return;
    start(async () => {
      const res = await deleteUserAction(u.id);
      if (res?.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3 p-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initials(u.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{u.name}</p>
        <p className="truncate text-xs text-ink-muted">{u.email}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          u.role === "ADMIN"
            ? "bg-warning/15 text-warning"
            : "bg-ink/5 text-ink-muted dark:bg-ink-inverse/10"
        }`}
      >
        {u.role}
      </span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          disabled={pending || isSelf}
          title={isSelf ? "You cannot change your own role" : "Toggle role"}
          onClick={toggleRole}
          className="flex size-8 items-center justify-center rounded-full bg-ink/5 text-ink-muted hover:bg-ink/10 disabled:opacity-50 dark:bg-ink-inverse/10 dark:hover:bg-ink-inverse/15"
          aria-label="Toggle role"
        >
          {u.role === "ADMIN" ? (
            <Shield className="size-3.5" />
          ) : (
            <User className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          disabled={pending || isSelf}
          title={isSelf ? "You cannot delete your own account" : "Delete user"}
          onClick={remove}
          className="flex size-8 items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger/15 disabled:opacity-50"
          aria-label="Delete user"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function UserManager({
  users,
  currentUserId,
}: {
  users: ManagedUser[];
  currentUserId: string;
}) {
  return (
    <div className="divide-y divide-border-light overflow-hidden rounded-2xl bg-card-light dark:divide-border-dark dark:bg-card-dark">
      {users.map((u) => (
        <Row key={u.id} u={u} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
