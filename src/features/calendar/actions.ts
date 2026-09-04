"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { userCanUseSubject } from "@/lib/enrollment";
import { parseWallClock } from "@/lib/datetime";
import { eventSchema, type ActionState } from "@/features/shared/validations";

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };

  const tzOffset = formData.get("tzOffset");
  const startDate = formData.get("startDate");
  const startTime = formData.get("startTime");
  const endDate = formData.get("endDate");
  const endTime = formData.get("endTime");
  const allDay = formData.get("allDay") === "on";
  const subjectId = String(formData.get("subjectId") ?? "").trim();

  const parsed = eventSchema.safeParse({
    title: String(formData.get("title") ?? "").trim().toUpperCase(),
    description: String(formData.get("description") ?? "").trim().toUpperCase(),
    start: typeof startDate === "string" ? startDate : "",
    end: typeof endDate === "string" ? endDate : "",
    type: String(formData.get("type") ?? "EVENT"),
    subjectId,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      error:
        flat.fieldErrors.title?.[0] ??
        flat.fieldErrors.type?.[0] ??
        "Please check the form.",
      fieldErrors: flat.fieldErrors,
    };
  }
  const { title, description, type } = parsed.data;

  if (!title) return { error: "Title is required." };
  if (!startDate) return { error: "Start date is required." };

  const start = parseWallClock(startDate, allDay ? "" : startTime, tzOffset);
  if (!start) return { error: "Start date is required." };

  let end: Date | null = null;
  if (typeof endDate === "string" && endDate !== "") {
    end = parseWallClock(endDate, allDay ? "" : endTime, tzOffset, "end-of-day");
    if (!end) return { error: "Invalid end date." };
    if (end.getTime() < start.getTime()) {
      return { error: "End must be after the start." };
    }
  }

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return { error: "Invalid subject." };
    if (!(await userCanUseSubject(user.id, subject))) {
      return { error: "You are not enrolled in that subject." };
    }
  }

  try {
    await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        start,
        end,
        allDay,
        type,
        userId: user.id,
        subjectId: subjectId || null,
      },
    });
  } catch (err) {
    console.error("[Calendar] create failed:", err);
    return { error: "Failed to create event. Please try again." };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

/** Edit an existing event. Same validation as create, plus ownership check. */
export async function updateEventAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof id !== "string" || !id) return { error: "Invalid event." };

  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) return { error: "Event not found." };
  if (existing.userId !== user.id) {
    return { error: "You can only edit events you created." };
  }

  const tzOffset = formData.get("tzOffset");
  const startDate = formData.get("startDate");
  const startTime = formData.get("startTime");
  const endDate = formData.get("endDate");
  const endTime = formData.get("endTime");
  const allDay = formData.get("allDay") === "on";
  const subjectId = String(formData.get("subjectId") ?? "").trim();

  const parsed = eventSchema.safeParse({
    title: String(formData.get("title") ?? "").trim().toUpperCase(),
    description: String(formData.get("description") ?? "").trim().toUpperCase(),
    start: typeof startDate === "string" ? startDate : "",
    end: typeof endDate === "string" ? endDate : "",
    type: String(formData.get("type") ?? existing.type),
    subjectId,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      error:
        flat.fieldErrors.title?.[0] ??
        flat.fieldErrors.type?.[0] ??
        "Please check the form.",
      fieldErrors: flat.fieldErrors,
    };
  }
  const { title, description, type } = parsed.data;

  if (!title) return { error: "Title is required." };
  if (!startDate) return { error: "Start date is required." };

  const start = parseWallClock(startDate, allDay ? "" : startTime, tzOffset);
  if (!start) return { error: "Start date is required." };

  let end: Date | null = null;
  if (typeof endDate === "string" && endDate !== "") {
    end = parseWallClock(endDate, allDay ? "" : endTime, tzOffset, "end-of-day");
    if (!end) return { error: "Invalid end date." };
    if (end.getTime() < start.getTime()) {
      return { error: "End must be after the start." };
    }
  }

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return { error: "Invalid subject." };
    if (!(await userCanUseSubject(user.id, subject))) {
      return { error: "You are not enrolled in that subject." };
    }
  }

  try {
    await prisma.calendarEvent.update({
      where: { id },
      data: {
        title,
        description: description || null,
        start,
        end,
        allDay,
        type,
        subjectId: subjectId || null,
      },
    });
  } catch (err) {
    console.error("[Calendar] update failed:", err);
    return { error: "Failed to update event. Please try again." };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteEventAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof id !== "string" || !id) return { error: "Invalid event." };

  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return { error: "Event not found." };
  if (event.userId !== user.id) {
    return { error: "You can only delete events you created." };
  }

  try {
    await prisma.calendarEvent.delete({ where: { id } });
  } catch (err) {
    console.error("[Calendar] delete failed:", err);
    return { error: "Failed to delete event. Please try again." };
  }
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}
