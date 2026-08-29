"use client";

import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction } from "@/features/groups/actions";
import type { ActionState } from "@/features/shared/validations";

const initial: ActionState = {};

export function GroupFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(createGroupAction, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state.ok, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} title="New group">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Group name</Label>
          <Input id="name" name="name" placeholder="e.g. ECET315 STUDY GROUP" autoCapitalize="characters" />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.name[0]}</p>
          )}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="WHAT IS THIS GROUP FOR?" autoCapitalize="characters" />
        </div>
        {state.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Create group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
