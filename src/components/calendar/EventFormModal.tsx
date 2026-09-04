"use client";

import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { LocalDateInput, LocalTimeInput } from "@/components/ui/LocalDateInput";
import { Button } from "@/components/ui/Button";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createEventAction, updateEventAction } from "@/features/calendar/actions";
import type { ActionState } from "@/features/shared/validations";
import type { Subject, CalendarEvent } from "@prisma/client";

const initial: ActionState = {};

export function EventFormModal({
  open,
  onClose,
  subjects,
  defaultStart,
  event,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultStart?: Date;
  event?: CalendarEvent;
}) {
  const isEdit = !!event;
  const [state, formAction, pending] = useActionState(
    isEdit ? updateEventAction.bind(null, event!.id) : createEventAction,
    initial,
  );
  const router = useRouter();
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const tzRef = useRef<HTMLInputElement>(null);

  const refreshTz = () => {
    if (tzRef.current) tzRef.current.value = String(new Date().getTimezoneOffset());
  };

  useEffect(() => {
    if (open && tzRef.current) {
      refreshTz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state.ok, onClose, router]);

  const startValue = event ? new Date(event.start) : defaultStart ?? null;
  const endValue = event?.end ? new Date(event.end) : null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit event" : "New event"}>
      <form action={formAction} onSubmit={refreshTz} className="space-y-4">
        <input type="hidden" name="tzOffset" ref={tzRef} defaultValue="" />
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={event?.title} placeholder="e.g. MIDTERM EXAM" autoCapitalize="characters" maxLength={120} required />
          {state.fieldErrors?.title && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue={event?.type ?? "EVENT"}>
            <option value="EVENT">Event</option>
            <option value="TASK">Task</option>
            <option value="DEADLINE">Deadline</option>
            <option value="EXAM">Exam</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="allDay"
            name="allDay"
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="size-4 rounded border-border-light accent-primary"
          />
          <Label htmlFor="allDay" className="mb-0">All day</Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start</Label>
            <div className={`grid grid-cols-2 gap-2 ${allDay ? "opacity-50" : ""}`}>
              <LocalDateInput id="startDate" name="startDate" value={startValue} required />
              {/* Hidden (not unmounted) when all-day, so typed values survive toggling. */}
              <div className={allDay ? "hidden" : "contents"}>
                <LocalTimeInput id="startTime" name="startTime" value={startValue} />
              </div>
            </div>
          </div>
          <div>
            <Label>End</Label>
            <div className={`grid grid-cols-2 gap-2 ${allDay ? "opacity-50" : ""}`}>
              <LocalDateInput id="endDate" name="endDate" value={endValue} />
              <div className={allDay ? "hidden" : "contents"}>
                <LocalTimeInput id="endTime" name="endTime" value={endValue} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select id="subject" name="subjectId" defaultValue={event?.subjectId ?? ""}>
            <option value="">None</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={event?.description ?? ""} placeholder="OPTIONAL" autoCapitalize="characters" maxLength={1000} />
        </div>

        {state.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isEdit ? "Save changes" : "Create event"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
