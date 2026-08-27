"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/features/shared/validations";

function parseDateTime(dateStr: unknown, timeStr: unknown): Date | null {
  if (typeof dateStr !== "string" || dateStr === "") return null;
  const time = typeof timeStr === "string" && timeStr !== "" ? timeStr : "00:00";
  const d = new Date(`${dateStr}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "EVENT");
  const startDate = formData.get("startDate");
  const startTime = formData.get("startTime");
  const endDate = formData.get("endDate");
  const endTime = formData.get("endTime");
  const allDay = formData.get("allDay") === "on";
  const subjectId = String(formData.get("subjectId") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }

  const start = parseDateTime(startDate, startTime);
  if (!start) {
    return { error: "Start date is required." };
  }

  await prisma.calendarEvent.create({
    data: {
      title,
      description: description || null,
      start,
      end: parseDateTime(endDate, endTime),
      allDay,
      type: type as "TASK" | "DEADLINE" | "EXAM" | "EVENT",
      userId: user.id,
      subjectId: subjectId || null,
    },
  });

  revalidatePath("/calendar");
  return { ok: true };
}

export async function deleteEventAction(id: string): Promise<void> {
  const user = await requireUser();
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return;
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendar");
}
