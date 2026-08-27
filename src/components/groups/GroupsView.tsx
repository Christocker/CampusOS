"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { GroupFormModal } from "@/components/groups/GroupFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users as UsersIcon } from "lucide-react";
import type { Group } from "@prisma/client";

type GroupSummary = Group & {
  _count: { members: number; tasks: number };
};

export function GroupsView({ groups }: { groups: GroupSummary[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <ScreenHeader
        title="Groups"
        subtitle={`${groups.length} groups`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        }
      />

      {groups.length ? (
        <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
          {groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <div className="flex items-center gap-3 px-4 py-3 transition active:bg-ink/5 dark:active:bg-ink-inverse/10">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UsersIcon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-note-body font-medium">{g.name}</p>
                  <p className="text-note-caption text-ink-muted">
                    {g._count.members} members · {g._count.tasks} tasks
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No groups yet"
          description="Create a group to collaborate on shared tasks with classmates."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New group
            </Button>
          }
        />
      )}

      <GroupFormModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
