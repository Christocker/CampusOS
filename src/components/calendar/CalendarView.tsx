"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { cn, formatDeadline } from "@/lib/utils";
import { EVENT_TYPE } from "@/lib/constants";
import { deleteEventAction } from "@/features/calendar/actions";
import type { Subject, Task, CalendarEvent } from "@prisma/client";

type TaskWithSubject = Task & { subject?: Subject | null };

type Item = {
  id: string;
  title: string;
  date: Date;
  color: string;
  href?: string;
  kind: "task" | "event";
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DayItemRow({
  it,
  onDeleteEvent,
  onEditEvent,
  deleting,
}: {
  it: Item;
  onDeleteEvent?: (id: string) => void;
  onEditEvent?: (id: string) => void;
  deleting?: boolean;
}) {
  const body = (
    <>
      <span className="size-2.5 rounded-full" style={{ backgroundColor: it.color }} />
      <span className="flex-1 truncate font-medium">{it.title}</span>
      <span className="text-xs text-ink-muted">{formatDeadline(it.date)}</span>
    </>
  );
  return (
    <div className="card flex items-center gap-3 p-3">
      {it.href ? (
        <Link href={it.href} className="flex flex-1 min-w-0 items-center gap-3">
          {body}
        </Link>
      ) : (
        <div className="flex flex-1 min-w-0 items-center gap-3">{body}</div>
      )}
      {it.kind === "event" && onEditEvent && (
        <button
          type="button"
          disabled={deleting}
          onClick={() => onEditEvent(it.id)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink-muted hover:bg-ink/10 disabled:opacity-50 dark:bg-ink-inverse/10"
          aria-label="Edit event"
        >
          <Pencil className="size-3.5" />
        </button>
      )}
      {it.kind === "event" && onDeleteEvent && (
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDeleteEvent(it.id)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger/15 disabled:opacity-50"
          aria-label="Delete event"
        >
          {deleting ? <Spinner className="size-3.5" /> : <Trash2 className="size-3.5" />}
        </button>
      )}
    </div>
  );
}

export function CalendarView({
  tasks,
  events,
  subjects,
}: {
  tasks: TaskWithSubject[];
  events: CalendarEvent[];
  subjects: Subject[];
}) {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [eventOpen, setEventOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const [deleting, startDelete] = useTransition();

  // Compute "today" once per render (was per cell -> inconsistent across
  // a midnight-spanning render pass).
  const today = new Date();

  const items = useMemo<Item[]>(() => {
    const fromTasks: Item[] = tasks
      .filter((t) => t.deadline)
      .map((t) => ({
        id: t.id,
        title: t.title,
        date: new Date(t.deadline!),
        color: t.subject?.color ?? "#007AFF",
        href: `/tasks/${t.id}`,
        kind: "task" as const,
      }));
    const fromEvents: Item[] = events.map((e) => ({
      id: e.id,
      title: e.title,
      date: new Date(e.start),
      color: EVENT_TYPE[e.type].color,
      kind: "event" as const,
    }));
    return [...fromTasks, ...fromEvents];
  }, [tasks, events]);

  const shift = (dir: number) => {
    const n = new Date(cursor);
    if (view === "month") {
      n.setDate(1);
      n.setMonth(n.getMonth() + dir);
      setCursor(n);
      // Keep the selected-day panel consistent with the visible month.
      setSelected(n);
    } else if (view === "week") {
      n.setDate(n.getDate() + dir * 7);
      setCursor(n);
      setSelected(n);
    } else {
      n.setDate(n.getDate() + dir);
      setCursor(n);
      setSelected(n);
    }
  };

  const monthGrid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const lead = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const selectedItems = useMemo(
    () =>
      items
        .filter((i) => sameDay(i.date, selected))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [items, selected],
  );

  const weekDays = useMemo(() => {
    const base = new Date(cursor);
    const day = base.getDay();
    base.setDate(base.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [cursor]);

  const openDay = (d: Date) => {
    setSelected(d);
    setCursor(d);
    setView("day");
  };

  const onDeleteEvent = (id: string) => {
    if (!confirm("Delete this event?")) return;
    setDeletingId(id);
    startDelete(async () => {
      const res = await deleteEventAction(id);
      setDeletingId(null);
      if (res?.error) alert(res.error);
      router.refresh();
    });
  };

  const openEditEvent = (id: string) => {
    setEditingId(id);
    setEventOpen(true);
  };

  const editingEvent = editingId
    ? events.find((e) => e.id === editingId) ?? null
    : null;

  const label =
    view === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
        ? `Week of ${cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : selected.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

  return (
    <div>
      <ScreenHeader
        title="Calendar"
        action={
          <Button size="sm" onClick={() => setEventOpen(true)}>
            <Plus className="size-4" /> Event
          </Button>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
                view === v
                  ? "bg-primary text-ink"
                  : "bg-ink/5 text-ink-muted dark:bg-ink-inverse/10 dark:text-ink-inverse/70",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="rounded-full p-2 text-ink-muted hover:bg-ink/5 dark:hover:bg-ink-inverse/10" aria-label="Previous">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => shift(1)} className="rounded-full p-2 text-ink-muted hover:bg-ink/5 dark:hover:bg-ink-inverse/10" aria-label="Next">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {view === "month" && (
        <div className="card p-3">
          <p className="mb-2 text-center text-sm font-semibold capitalize">{label}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-muted">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="py-1 font-medium">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((d, i) => {
              if (!d) return <div key={i} />;
              const dayItems = items.filter((it) => sameDay(it.date, d));
              const isToday = sameDay(d, today);
              const isSel = sameDay(d, selected);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  onDoubleClick={() => openDay(d)}
                  className={cn(
                    "flex min-h-[52px] flex-col rounded-lg p-1 text-left transition",
                    isSel ? "bg-primary/10" : "hover:bg-ink/5 dark:hover:bg-ink-inverse/10",
                  )}
                >
                  <span
                    className={cn(
                      "mb-0.5 flex size-6 items-center justify-center rounded-full text-xs",
                      isToday && "bg-primary text-white",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayItems.slice(0, 2).map((it) => (
                      <span
                        key={it.id}
                        className="truncate rounded px-1 py-0.5 text-[9px] leading-tight text-white"
                        style={{ backgroundColor: it.color }}
                        title={it.title}
                      >
                        {it.title}
                      </span>
                    ))}
                    {dayItems.length > 2 && (
                      <span className="text-[10px] leading-none text-ink-muted">
                        +{dayItems.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => {
            const dayItems = items.filter((it) => sameDay(it.date, d));
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);
            return (
              <button
                key={d.toDateString()}
                type="button"
                onClick={() => setSelected(d)}
                onDoubleClick={() => openDay(d)}
                className={cn(
                  "card flex flex-col p-1.5 text-left transition",
                  isSel && "ring-2 ring-primary",
                )}
              >
                <p className={cn("text-center text-xs", isToday ? "font-bold text-primary" : "text-ink-muted")}>
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className={cn("text-center text-sm font-semibold", isToday && "text-primary")}>
                  {d.getDate()}
                </p>
                <div className="mt-1 space-y-1">
                  {dayItems.slice(0, 3).map((it) => (
                    <span
                      key={it.id}
                      className="block truncate rounded px-1 py-0.5 text-[10px] text-white"
                      style={{ backgroundColor: it.color }}
                      title={it.title}
                    >
                      {it.title}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <div className="card p-4">
          <p className="mb-3 text-sm font-semibold">{label}</p>
          {selectedItems.length ? (
            <div className="space-y-2">
              {selectedItems.map((it) => (
                <DayItemRow key={it.id} it={it} onDeleteEvent={onDeleteEvent} onEditEvent={openEditEvent} deleting={deleting && deletingId === it.id} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Nothing scheduled.</p>
          )}
        </div>
      )}

      {view !== "day" && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold">
            {selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h2>
          {selectedItems.length ? (
            <div className="space-y-2">
              {selectedItems.map((it) => (
                <DayItemRow key={it.id} it={it} onDeleteEvent={onDeleteEvent} onEditEvent={openEditEvent} deleting={deleting && deletingId === it.id} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Nothing scheduled.</p>
          )}
        </div>
      )}

      {eventOpen && (
        <EventFormModal
          key={editingEvent?.id ?? "new"}
          open
          onClose={() => {
            setEventOpen(false);
            setEditingId(null);
          }}
          subjects={subjects}
          defaultStart={selected}
          event={editingEvent ?? undefined}
        />
      )}
    </div>
  );
}
