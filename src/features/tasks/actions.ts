"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { userCanUseSubject } from "@/lib/enrollment";
import { parseWallClock } from "@/lib/datetime";
import { sendEmail, escapeHtml } from "@/lib/email";
import { taskSchema, type ActionState } from "@/features/shared/validations";

/** Date-only deadlines mean "by end of day". */
function parseDeadline(
  dateStr: unknown,
  timeStr: unknown,
  tzOffsetRaw: unknown,
): Date | null {
  return parseWallClock(dateStr, timeStr, tzOffsetRaw, "end-of-day");
}

/** Keep user text from breaking email headers. */
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, 200);
}

function validationError(
  parsed: { error: { flatten: () => { fieldErrors: Record<string, string[] | undefined>; formErrors: string[] } } },
): ActionState {
  const flat = parsed.error.flatten();
  const first =
    flat.fieldErrors.title?.[0] ??
    flat.fieldErrors.description?.[0] ??
    flat.fieldErrors.priority?.[0] ??
    flat.fieldErrors.status?.[0] ??
    flat.formErrors[0] ??
    "Please check the form.";
  return { error: first, fieldErrors: flat.fieldErrors };
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

async function notifyRecipients(
  recipients: { email: string; name: string }[],
  taskTitle: string,
  subjectName: string,
  event: string,
  extraHtml?: string,
) {
  const safeTitle = escapeHtml(taskTitle);
  const safeSubject = escapeHtml(subjectName);
  const safeEvent = escapeHtml(event);
  for (const r of recipients) {
    await sendEmail({
      to: r.email,
      subject: `CampusOS: ${singleLine(event)} — ${singleLine(taskTitle)}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1C1C1E;">${safeEvent}</h2>
          <p style="color: #8E8E93; font-size: 15px;">
            Hi ${escapeHtml(r.name)}, <strong>${safeTitle}</strong> in <strong>${safeSubject}</strong> was updated.
          </p>
          ${extraHtml ? `<div style="background: #F8F8FA; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #8E8E93;">${extraHtml}</p>
          </div>` : ""}
          <p style="color: #8E8E93; font-size: 13px; margin-top: 24px;">
            This is an automated message from CampusOS.
          </p>
        </div>
      `,
    });
  }
}

function revalidateTaskSurfaces(taskId: string, ...subjectIds: (string | null | undefined)[]) {
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath(`/tasks/${taskId}`);
  for (const sid of subjectIds) {
    if (sid) {
      revalidatePath("/subjects");
      revalidatePath(`/subjects/${sid}`);
    }
  }
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };

  const parsed = taskSchema.safeParse({
    title: String(formData.get("title") ?? "").trim().toUpperCase(),
    description: String(formData.get("description") ?? "").trim().toUpperCase(),
    subjectId: String(formData.get("subjectId") ?? "").trim(),
    status: "NOT_STARTED",
    priority: String(formData.get("priority") ?? "MEDIUM"),
    deadline: "",
  });
  if (!parsed.success) return validationError(parsed);

  const { title, description, subjectId, priority } = parsed.data;
  if (!subjectId) return { error: "Subject is required." };

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return { error: "Invalid subject." };
  if (!(await userCanUseSubject(user.id, subject))) {
    return { error: "You are not enrolled in that subject." };
  }

  const deadline = parseDeadline(
    formData.get("deadlineDate"),
    formData.get("deadlineTime"),
    formData.get("tzOffset"),
  );

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      subjectId,
      status: "NOT_STARTED",
      priority,
      deadline,
      userId: user.id,
    },
  });

  const deadlineStr = deadline
    ? ` Due: ${escapeHtml(deadline.toLocaleDateString())}`
    : "";
  await notifyRecipients(
    await getEmailRecipients(subjectId, user.id),
    title,
    subject.name,
    "New task assigned",
    `Priority: ${escapeHtml(priority)}${deadlineStr}${description ? `<br/>${escapeHtml(description)}` : ""}`,
  );

  revalidateTaskSurfaces(task.id, subjectId);
  return { ok: true };
}

export async function updateTaskAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof id !== "string" || !id) return { error: "Invalid task." };

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return { error: "Task not found." };
  if (existing.userId !== user.id) {
    return { error: "You can only edit tasks you created." };
  }

  const parsed = taskSchema.safeParse({
    title: String(formData.get("title") ?? "").trim().toUpperCase(),
    description: String(formData.get("description") ?? "").trim().toUpperCase(),
    subjectId: String(formData.get("subjectId") ?? "").trim(),
    status: String(formData.get("status") ?? existing.status),
    priority: String(formData.get("priority") ?? existing.priority),
    deadline: "",
  });
  if (!parsed.success) return validationError(parsed);

  const { title, description, subjectId, status, priority } = parsed.data;
  if (!subjectId) return { error: "Subject is required." };

  if (subjectId !== existing.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return { error: "Invalid subject." };
    if (!(await userCanUseSubject(user.id, subject))) {
      return { error: "You are not enrolled in that subject." };
    }
  }

  const newDeadline = parseDeadline(
    formData.get("deadlineDate"),
    formData.get("deadlineTime"),
    formData.get("tzOffset"),
  );

  const changes: string[] = [];
  if (title !== existing.title) changes.push(`Title changed to "${escapeHtml(title)}"`);
  if (description !== (existing.description ?? "")) changes.push("Description updated");
  if (priority !== existing.priority) changes.push(`Priority changed to ${escapeHtml(priority)}`);
  if (status !== existing.status) {
    changes.push(`Status changed to ${escapeHtml(status.replace(/_/g, " ").toLowerCase())}`);
  }
  if (newDeadline?.getTime() !== existing.deadline?.getTime()) {
    changes.push(`Deadline changed to ${newDeadline ? escapeHtml(newDeadline.toLocaleDateString()) : "none"}`);
  }

  await prisma.task.update({
    where: { id },
    data: {
      title,
      description: description || null,
      subjectId,
      status,
      priority,
      deadline: newDeadline,
      // completedAt only meaningful while status is COMPLETED; set it when
      // the task *becomes* completed, keep it while staying completed, and
      // clear it whenever status moves away from COMPLETED.
      completedAt:
        status === "COMPLETED"
          ? existing.status === "COMPLETED"
            ? existing.completedAt ?? new Date()
            : new Date()
          : null,
    },
  });

  if (changes.length > 0) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    await notifyRecipients(
      await getEmailRecipients(subjectId, user.id),
      title,
      subject?.name ?? "a subject",
      "Task updated",
      changes.join("<br/>"),
    );
  }

  revalidateTaskSurfaces(id, existing.subjectId, subjectId);
  return { ok: true };
}

/** Whether a user may interact with (view/complete/comment) a task. */
async function canViewTask(
  user: { id: string },
  task: { userId: string; subjectId: string | null; groupId: string | null },
): Promise<boolean> {
  if (task.userId === user.id) return true;
  if (task.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId: user.id } },
      select: { id: true },
    });
    if (membership) return true;
  }
  if (task.subjectId) {
    const enrollment = await prisma.userEnrollment.findUnique({
      where: { userId_subjectId: { userId: user.id, subjectId: task.subjectId } },
      select: { id: true },
    });
    if (enrollment) return true;
    const subject = await prisma.subject.findUnique({
      where: { id: task.subjectId },
      select: { userId: true },
    });
    if (subject && subject.userId === user.id) return true;
  }
  return false;
}

export async function toggleTaskCompleteAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof id !== "string" || !id) return { error: "Invalid task." };

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return { error: "Task not found." };
  if (!(await canViewTask(user, existing))) {
    return { error: "You cannot interact with this task." };
  }

  // Atomic read+write so rapid double-toggles can't both read the same state.
  const now = new Date();
  const wasCompleted = await prisma.$transaction(async (tx) => {
    const completion = await tx.taskCompletion.findUnique({
      where: { taskId_userId: { taskId: id, userId: user.id } },
    });
    const previous = completion?.completed ?? false;
    await tx.taskCompletion.upsert({
      where: { taskId_userId: { taskId: id, userId: user.id } },
      update: { completed: !previous, completedAt: !previous ? now : null },
      create: { taskId: id, userId: user.id, completed: !previous, completedAt: !previous ? now : null },
    });
    return previous;
  });

  if (existing.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: existing.subjectId } });
    await notifyRecipients(
      await getEmailRecipients(existing.subjectId, user.id),
      existing.title,
      subject?.name ?? "a subject",
      wasCompleted ? "Task reopened" : "Task completed",
      `Marked as ${wasCompleted ? "incomplete" : "completed"} by ${escapeHtml(user.name ?? "a classmate")}.`,
    );
  }

  revalidateTaskSurfaces(id, existing.subjectId);
  return { ok: true };
}

export async function deleteTaskAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof id !== "string" || !id) return { error: "Invalid task." };

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return { error: "Task not found." };
  if (existing.userId !== user.id) {
    return { error: "You can only delete tasks you created." };
  }

  await prisma.task.delete({ where: { id } });

  if (existing.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: existing.subjectId } });
    await notifyRecipients(
      await getEmailRecipients(existing.subjectId, user.id),
      existing.title,
      subject?.name ?? "a subject",
      "Task deleted",
      `Deleted by ${escapeHtml(user.name ?? "a classmate")}.`,
    );
  }

  revalidateTaskSurfaces(id, existing.subjectId);
  return { ok: true };
}
