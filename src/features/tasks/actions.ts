"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/features/shared/validations";
import type { TaskStatus } from "@prisma/client";

function parseDeadline(dateStr: unknown, timeStr: unknown): Date | null {
  if (typeof dateStr !== "string" || dateStr === "") return null;
  const time = typeof timeStr === "string" && timeStr !== "" ? timeStr : "23:59";
  const d = new Date(`${dateStr}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const status = String(formData.get("status") ?? "NOT_STARTED");
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const deadlineDate = formData.get("deadlineDate");
  const deadlineTime = formData.get("deadlineTime");

  if (!title) {
    return { error: "Title is required." };
  }

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return { error: "Invalid subject." };
    }
  }

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      subjectId: subjectId || null,
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED",
      priority: priority as "LOW" | "MEDIUM" | "HIGH",
      deadline: parseDeadline(deadlineDate, deadlineTime),
      userId: user.id,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/subjects");
  return { ok: true };
}

export async function updateTaskAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Task not found." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const status = String(formData.get("status") ?? existing.status);
  const priority = String(formData.get("priority") ?? existing.priority);
  const deadlineDate = formData.get("deadlineDate");
  const deadlineTime = formData.get("deadlineTime");

  if (!title) {
    return { error: "Title is required." };
  }

  await prisma.task.update({
    where: { id },
    data: {
      title,
      description: description || null,
      subjectId: subjectId || null,
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED",
      priority: priority as "LOW" | "MEDIUM" | "HIGH",
      deadline: parseDeadline(deadlineDate, deadlineTime),
      completedAt:
        status === "COMPLETED" ? new Date() : existing.completedAt ?? null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function setTaskStatusAction(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath(`/tasks/${id}`);
}

export async function toggleTaskCompleteAction(id: string): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return;
  const completed = existing.status === "COMPLETED";
  await prisma.task.update({
    where: { id },
    data: {
      status: completed ? "NOT_STARTED" : "COMPLETED",
      completedAt: completed ? null : new Date(),
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath(`/tasks/${id}`);
}

export async function deleteTaskAction(id: string): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}
