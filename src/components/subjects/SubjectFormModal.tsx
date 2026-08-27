"use client";

import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState, useEffect } from "react";
import { createSubjectAction, updateSubjectAction } from "@/features/subjects/actions";
import type { ActionState } from "@/features/shared/validations";
import { SUBJECT_COLORS } from "@/lib/constants";
import type { Subject } from "@prisma/client";
import { cn } from "@/lib/utils";

const initial: ActionState = {};

export function SubjectFormModal({
  open,
  onClose,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  subject?: Subject;
}) {
  const isEdit = !!subject;
  const [state, formAction, pending] = useActionState(
    isEdit ? updateSubjectAction.bind(null, subject!.id) : createSubjectAction,
    initial,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit subject" : "New subject"}>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={subject?.name} placeholder="e.g. DIGITAL ELECTRONICS" autoCapitalize="characters" />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="classCode">Class Code</Label>
          <Input id="classCode" name="classCode" defaultValue={(subject as Subject & { classCode?: string })?.classCode ?? ""} placeholder="e.g. ECET315" autoCapitalize="characters" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="professor">Professor</Label>
            <Input id="professor" name="professor" defaultValue={subject?.professor ?? ""} placeholder="DR. SMITH" autoCapitalize="characters" />
          </div>
          <div>
            <Label htmlFor="semester">Semester</Label>
            <Select id="semester" name="semester" defaultValue={subject?.semester ?? ""}>
              <option value="">Select...</option>
              <option value="1st Sem">1st Sem</option>
              <option value="2nd Sem">2nd Sem</option>
              <option value="Special Term">Special Term</option>
            </Select>
          </div>
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((c) => {
              const active = (subject?.color ?? "#007AFF") === c;
              return (
                <label key={c} className="relative">
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    defaultChecked={active}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "block size-9 cursor-pointer rounded-full ring-offset-2 ring-offset-card-light transition peer-checked:ring-2 peer-checked:ring-ink dark:ring-offset-card-dark",
                      active && "ring-2",
                    )}
                    style={{ backgroundColor: c, boxShadow: active ? `0 0 0 2px ${c}` : undefined }}
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={subject?.description ?? ""} placeholder="OPTIONAL" autoCapitalize="characters" />
        </div>

        {state.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isEdit ? "Save changes" : "Create subject"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
