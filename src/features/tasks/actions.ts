"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import type { ActionState } from "@/features/shared/validations";

function parseDeadline(dateStr: unknown, timeStr: unknown): Date | null {
  if (typeof dateStr !== "string" || dateStr === "") return null;
  const time = typeof timeStr === "string" && timeStr !== "" ? timeStr : "00:00";
  const d = new Date(`${dateStr}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getEmailRecipients(subjectId: string, excludeUserId?: string) {
  if (!subjectId) return [];
  const enrollments = await prisma.userEnrollment.findMany({
    where: { subjectId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return enrollments
    .filter((e) => e.user.id !== excludeUserId && e.user.email)
    .map((e) => ({ email: e.user.email!, name: e.user.name ?? "there" }));
}

function notifyRecipients(
  recipients: { email: string; name: string }[],
  taskTitle: string,
  subjectName: string,
  event: string,
  extra?: string,
) {
  for (const r of recipients) {
    sendEmail({
      to: r.email,
      subject: `CampusOS: ${event} — ${taskTitle}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1C1C1E;">${event}</h2>
          <p style="color: #8E8E93; font-size: 15px;">
            Hi ${r.name}, <strong>${taskTitle}</strong> in <strong>${subjectName}</strong> was updated.
          </p>
          ${extra ? `<div style="background: #F8F8FA; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #8E8E93;">${extra}</p>
          </div>` : ""}
          <p style="color: #8E8E93; font-size: 13px; margin-top: 24px;">
            This is an automated message from CampusOS.
          </p>
        </div>
      `,
    });
  }
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };

  const title = String(formData.get("title") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim().toUpperCase();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const deadlineDate = formData.get("deadlineDate");
  const deadlineTime = formData.get("deadlineTime");

  if (!title) return { error: "Title is required." };
  if (!subjectId) return { error: "Subject is required." };

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return { error: "Invalid subject." };
  }

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      subjectId: subjectId || null,
      status: "NOT_STARTED",
      priority: priority as "LOW" | "MEDIUM" | "HIGH",
      deadline: parseDeadline(deadlineDate, deadlineTime),
      userId: user.id,
    },
  });

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const deadline = parseDeadline(deadlineDate, deadlineTime);
    const deadlineStr = deadline ? ` Due: ${deadline.toLocaleDateString()}` : "";
    const recipients = await getEmailRecipients(subjectId, user.id);
    notifyRecipients(recipients, title, subject?.name ?? "a subject", "New task assigned",
      `Priority: ${priority}${deadlineStr}${description ? `<br/>${description}` : ""}`);
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
  if (!existing) return { error: "Task not found." };

  const title = String(formData.get("title") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim().toUpperCase();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const status = String(formData.get("status") ?? existing.status);
  const priority = String(formData.get("priority") ?? existing.priority);
  const deadlineDate = formData.get("deadlineDate");
  const deadlineTime = formData.get("deadlineTime");

  if (!title) return { error: "Title is required." };

  const changes: string[] = [];
  if (title !== existing.title) changes.push(`Title changed to "${title}"`);
  if (description !== (existing.description ?? "")) changes.push("Description updated");
  if (priority !== existing.priority) changes.push(`Priority changed to ${priority}`);
  if (status !== existing.status) changes.push(`Status changed to ${status.replace(/_/g, " ").toLowerCase()}`);
  const newDeadline = parseDeadline(deadlineDate, deadlineTime);
  if (newDeadline?.getTime() !== existing.deadline?.getTime()) {
    changes.push(`Deadline changed to ${newDeadline ? newDeadline.toLocaleDateString() : "none"}`);
  }

  await prisma.task.update({
    where: { id },
    data: {
      title,
      description: description || null,
      subjectId: subjectId || null,
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED",
      priority: priority as "LOW" | "MEDIUM" | "HIGH",
      deadline: newDeadline,
      completedAt: status === "COMPLETED" ? new Date() : existing.completedAt ?? null,
    },
  });

  if (changes.length > 0) {
    const subId = subjectId || existing.subjectId || "";
    const subject = await prisma.subject.findUnique({ where: { id: subId } });
    const recipients = await getEmailRecipients(subId, user.id);
    notifyRecipients(recipients, title, subject?.name ?? "a subject", "Task updated", changes.join("<br/>"));
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function setTaskStatusAction(
  id: string,
  status: string,
): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return;

  const nowCompleted = status === "COMPLETED";

  await prisma.taskCompletion.upsert({
    where: { taskId_userId: { taskId: id, userId: user.id } },
    update: { completed: nowCompleted, completedAt: nowCompleted ? new Date() : null },
    create: { taskId: id, userId: user.id, completed: nowCompleted, completedAt: nowCompleted ? new Date() : null },
  });

  if (nowCompleted) {
    const subject = await prisma.subject.findUnique({ where: { id: existing.subjectId ?? "" } });
    const recipients = await getEmailRecipients(existing.subjectId ?? "", user.id);
    notifyRecipients(recipients, existing.title, subject?.name ?? "a subject", "Task completed",
      `Marked as completed by ${user.name ?? "a classmate"}.`);
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath(`/tasks/${id}`);
}

export async function toggleTaskCompleteAction(id: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return;

  const completion = await prisma.taskCompletion.findUnique({
    where: { taskId_userId: { taskId: id, userId: user.id } },
  });
  const wasCompleted = completion?.completed ?? false;

  await prisma.taskCompletion.upsert({
    where: { taskId_userId: { taskId: id, userId: user.id } },
    update: { completed: !wasCompleted, completedAt: !wasCompleted ? new Date() : null },
    create: { taskId: id, userId: user.id, completed: !wasCompleted, completedAt: !wasCompleted ? new Date() : null },
  });

  const subject = await prisma.subject.findUnique({ where: { id: existing.subjectId ?? "" } });
  const recipients = await getEmailRecipients(existing.subjectId ?? "", user.id);
  notifyRecipients(recipients, existing.title, subject?.name ?? "a subject",
    wasCompleted ? "Task reopened" : "Task completed",
    `Marked as ${wasCompleted ? "incomplete" : "completed"} by ${user.name ?? "a classmate"}.`);

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath(`/tasks/${id}`);
}

export async function deleteTaskAction(id: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return;

  if (existing.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: existing.subjectId } });
    const recipients = await getEmailRecipients(existing.subjectId, user.id);
    notifyRecipients(recipients, existing.title, subject?.name ?? "a subject", "Task deleted",
      `Deleted by ${user.name ?? "a classmate"}.`);
  }

  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}
