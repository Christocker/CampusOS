"use client";

import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState, useEffect } from "react";
import { createTaskAction, updateTaskAction } from "@/features/tasks/actions";
import type { ActionState } from "@/features/shared/validations";
import type { Subject, Task } from "@prisma/client";

const initial: ActionState = {};

function toLocalDate(d?: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTime(d?: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskFormModal({
  open,
  onClose,
  subjects,
  task,
  defaultGroupId,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  task?: Task;
  defaultGroupId?: string;
}) {
  const isEdit = !!task;
  const [state, formAction, pending] = useActionState(
    isEdit ? updateTaskAction.bind(null, task!.id) : createTaskAction,
    initial,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit task" : "New task"}
      description={defaultGroupId ? "Shared with your group" : undefined}
    >
      <form action={formAction} className="space-y-4">
        {defaultGroupId && (
          <input type="hidden" name="groupId" value={defaultGroupId} />
        )}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={task?.title} placeholder="e.g. LAB REPORT" autoCapitalize="characters" />
          {state.fieldErrors?.title && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={task?.description ?? ""} placeholder="OPTIONAL DETAILS" autoCapitalize="characters" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select id="subject" name="subjectId" defaultValue={task?.subjectId ?? ""}>
              <option value="">None</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </div>
        </div>

        {isEdit && (
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={task?.status ?? "NOT_STARTED"}>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
        )}

        <div>
          <Label>Deadline</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="deadlineDate"
              type="date"
              name="deadlineDate"
              defaultValue={task ? toLocalDate(task.deadline) : ""}
            />
            <Input
              id="deadlineTime"
              type="time"
              name="deadlineTime"
              defaultValue={task ? toLocalTime(task.deadline) : ""}
              placeholder="Optional"
            />
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
