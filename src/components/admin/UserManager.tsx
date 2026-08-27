"use client";

import { useTransition } from "react";
import { Trash2, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteUserAction, changeUserRoleAction } from "@/features/admin/actions";
import { initials } from "@/lib/utils";
import type { User as UserType } from "@prisma/client";

export function UserManager({ users }: { users: UserType[] }) {
  const [pending, start] = useTransition();

  return (
    <div className="divide-y divide-border-light overflow-hidden rounded-2xl bg-card-light dark:divide-border-dark dark:bg-card-dark">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 p-3.5">
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
              disabled={pending}
              onClick={() =>
                start(() =>
                  changeUserRoleAction(
                    u.id,
                    u.role === "ADMIN" ? "STUDENT" : "ADMIN",
                  ),
                )
              }
              className="flex size-8 items-center justify-center rounded-full bg-ink/5 text-ink-muted hover:bg-ink/10 dark:bg-ink-inverse/10 dark:hover:bg-ink-inverse/15"
              aria-label="Toggle role"
            >
              {u.role === "ADMIN" ? (
                <Shield className="size-3.5" />
              ) : (
                <User className="size-3.5" />
              )}
            </button>
            <button
              disabled={pending}
              onClick={() => {
                if (confirm(`Delete ${u.name}? Their data will be removed.`))
                  start(() => deleteUserAction(u.id));
              }}
              className="flex size-8 items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger/15"
              aria-label="Delete user"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
