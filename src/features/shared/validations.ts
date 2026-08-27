import { z } from "zod";
import { SUBJECT_COLORS } from "@/lib/constants";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
  code?: string;
};

export const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  professor: z.string().max(80).optional().or(z.literal("")),
  semester: z.string().max(40).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pick a valid color")
    .refine((c) => (SUBJECT_COLORS as readonly string[]).includes(c), {
      message: "Pick one of the available colors",
    }),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  subjectId: z.string().optional().or(z.literal("")),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  deadline: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid date"),
});

export const groupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(60),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const commentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(1000),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  start: z.string().min(1, "Start date is required"),
  end: z.string().optional().or(z.literal("")),
  allDay: z.boolean().optional(),
  type: z.enum(["TASK", "DEADLINE", "EXAM", "EVENT"]),
  subjectId: z.string().optional().or(z.literal("")),
});
