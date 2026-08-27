"use client";

import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState, useEffect } from "react";
import { createGroupTaskAction } from "@/features/groups/actions";
import type { ActionState } from "@/features/shared/validations";
import type { Subject } from "@prisma/client";

const initial: ActionState = {};

function toLocalInput(d?: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GroupTaskFormModal({
  open,
  onClose,
  groupId,
  subjects,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  subjects: Subject[];
}) {
  const [state, formAction, pending] = useActionState(
    createGroupTaskAction.bind(null, groupId),
    initial,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="New shared task">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="gt-title">Title</Label>
          <Input id="gt-title" name="title" placeholder="e.g. Experiment 3" />
          {state.fieldErrors?.title && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.title[0]}</p>
          )}
        </div>
        <div>
          <Label htmlFor="gt-desc">Description</Label>
          <Textarea id="gt-desc" name="description" placeholder="Optional" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="gt-priority">Priority</Label>
            <Select id="gt-priority" name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="gt-status">Status</Label>
            <Select id="gt-status" name="status" defaultValue="NOT_STARTED">
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="gt-deadline">Deadline</Label>
          <Input id="gt-deadline" type="datetime-local" name="deadline" />
        </div>

        {state.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Create task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
