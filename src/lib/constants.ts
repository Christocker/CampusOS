import type { Priority, TaskStatus, EventType } from "@prisma/client";

export const SUBJECT_COLORS = [
  "#007AFF",
  "#34C759",
  "#FF9500",
  "#FF3B30",
  "#AF52DE",
  "#5856D6",
  "#FF2D55",
  "#00C7BE",
  "#FFCC00",
  "#8E8E93",
  "#FF6B6B",
  "#48DBFB",
  "#FECA57",
  "#1DD1A1",
  "#EE5A24",
  "#A3CB38",
  "#6C5CE7",
  "#FD79A8",
  "#00B894",
  "#E17055",
] as const;

export const TASK_STATUS: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  NOT_STARTED: { label: "Not Started", color: "#8E8E93", bg: "bg-ink-muted/15" },
  IN_PROGRESS: { label: "In Progress", color: "#FF9500", bg: "bg-warning/15" },
  SUBMITTED: { label: "Submitted", color: "#007AFF", bg: "bg-primary/15" },
  COMPLETED: { label: "Completed", color: "#34C759", bg: "bg-success/15" },
};

export const PRIORITY: Record<
  Priority,
  { label: string; color: string; dot: string }
> = {
  LOW: { label: "Low", color: "#8E8E93", dot: "bg-ink-muted" },
  MEDIUM: { label: "Medium", color: "#FF9500", dot: "bg-warning" },
  HIGH: { label: "High", color: "#FF3B30", dot: "bg-danger" },
};

export const EVENT_TYPE: Record<
  EventType,
  { label: string; color: string }
> = {
  TASK: { label: "Task", color: "#007AFF" },
  DEADLINE: { label: "Deadline", color: "#FF3B30" },
  EXAM: { label: "Exam", color: "#FF9500" },
  EVENT: { label: "Event", color: "#34C759" },
};
