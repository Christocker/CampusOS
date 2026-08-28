"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendEmail } from "@/lib/email";
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
  if (!user) return { error: "Session expired. Please sign in again." };

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

  if (subjectId) {
    const enrollments = await prisma.userEnrollment.findMany({
      where: { subjectId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const subjectName = subject?.name ?? "a subject";
    const deadline = parseDeadline(deadlineDate, deadlineTime);
    const deadlineStr = deadline ? ` Due: ${deadline.toLocaleDateString()}` : "";

    for (const e of enrollments) {
      if (e.user.id !== user.id && e.user.email) {
        sendEmail({
          to: e.user.email,
          subject: `CampusOS: New task in ${subjectName}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1C1C1E;">New Task Assigned</h2>
              <p style="color: #8E8E93; font-size: 15px;">
                Hi ${e.user.name ?? "there"}, a new task has been added to <strong>${subjectName}</strong>.
              </p>
              <div style="background: #F8F8FA; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1C1C1E;">${title}</p>
                ${description ? `<p style="margin: 8px 0 0; font-size: 14px; color: #8E8E93;">${description}</p>` : ""}
                <p style="margin: 8px 0 0; font-size: 13px; color: #8E8E93;">Priority: ${priority}${deadlineStr}</p>
              </div>
              <p style="color: #8E8E93; font-size: 13px; margin-top: 24px;">
                This is an automated message from CampusOS.
              </p>
            </div>
          `,
        });
      }
    }
  }

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
  if (!user) return { error: "Session expired. Please sign in again." };
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
  if (!user) return;
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
  if (!user) return;
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
  if (!user) return;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}
