"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { SubjectFormModal } from "@/components/subjects/SubjectFormModal";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { GroupFormModal } from "@/components/groups/GroupFormModal";
import { CalendarPlus, BookPlus, ListPlus, Users } from "lucide-react";
import type { Subject } from "@prisma/client";

type Mode = null | "task" | "subject" | "event" | "group";

export function CreateSheet({ subjects }: { subjects: Subject[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(null);

  const closeAll = () => {
    setMode(null);
    setSheetOpen(false);
  };

  const open = (m: Exclude<Mode, null>) => {
    setSheetOpen(false);
    setMode(m);
  };

  const options = [
    { key: "task" as const, icon: ListPlus, label: "Task", hint: "Add a to-do" },
    { key: "subject" as const, icon: BookPlus, label: "Subject", hint: "Add a course" },
    { key: "event" as const, icon: CalendarPlus, label: "Event", hint: "Exam or deadline" },
    { key: "group" as const, icon: Users, label: "Group", hint: "Study group" },
  ];

  return (
    <>
      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Create">
        <div className="divide-y divide-border-light overflow-hidden rounded-xl dark:divide-border-dark">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => open(o.key)}
              className="flex w-full items-center gap-3 p-3.5 text-left transition active:bg-ink/5 dark:active:bg-ink-inverse/10"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <o.icon className="size-4.5" />
              </span>
              <div>
                <p className="text-note-headline">{o.label}</p>
                <p className="text-note-caption text-ink-muted">{o.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {mode === "task" && (
        <TaskFormModal open onClose={closeAll} subjects={subjects} />
      )}
      {mode === "subject" && (
        <SubjectFormModal open onClose={closeAll} />
      )}
      {mode === "event" && (
        <EventFormModal open onClose={closeAll} subjects={subjects} />
      )}
      {mode === "group" && (
        <GroupFormModal open onClose={closeAll} />
      )}

      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Create"
        className="absolute left-1/2 top-0 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-ink shadow-float transition active:scale-90"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </>
  );
}
