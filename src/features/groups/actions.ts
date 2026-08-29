"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  groupSchema,
  commentSchema,
  taskSchema,
} from "@/features/shared/validations";
import type { ActionState } from "@/features/shared/validations";

export async function createGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: "Check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const group = await prisma.group.create({
    data: {
      name: String(parsed.data.name).toUpperCase(),
      description: parsed.data.description ? String(parsed.data.description).toUpperCase() : null,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
  });

  revalidatePath("/groups");
  return { ok: true, ...(group as object) };
}

export async function addMemberAction(
  groupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group || (group.ownerId !== user.id && !group.members.some((m) => m.userId === user.id))) {
    return { error: "Group not found." };
  }

  const email = String(formData.get("email") ?? "");
  const invitee = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!invitee) return { error: "No user with that email exists yet." };

  const already = group.members.some((m) => m.userId === invitee.id);
  if (already) return { error: "User is already a member." };

  await prisma.groupMember.create({
    data: { groupId, userId: invitee.id, role: "MEMBER" },
  });

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function removeMemberAction(
  groupId: string,
  memberUserId: string,
): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== user.id) return;

  if (memberUserId === user.id) return; // owner cannot remove self
  await prisma.groupMember.deleteMany({
    where: { groupId, userId: memberUserId },
  });
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroupAction(groupId: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  await prisma.groupMember.deleteMany({
    where: { groupId, userId: user.id },
  });
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
}

export async function deleteGroupAction(groupId: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== user.id) return;
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/groups");
}

export async function createGroupTaskAction(
  groupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group || !group.members.some((m) => m.userId === user.id)) {
    return { error: "You are not a member of this group." };
  }

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    subjectId: formData.get("subjectId") ?? "",
    status: formData.get("status") ?? "NOT_STARTED",
    priority: formData.get("priority") ?? "MEDIUM",
    deadline: formData.get("deadline") ?? "",
  });

  if (!parsed.success) {
    return { error: "Check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { title, description, status, priority, deadline } = parsed.data;
  await prisma.task.create({
    data: {
      title: String(title).toUpperCase(),
      description: description ? String(description).toUpperCase() : null,
      status,
      priority,
      deadline: deadline ? new Date(deadline) : null,
      userId: user.id,
      groupId,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function addCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  const parsed = commentSchema.safeParse({
    taskId: formData.get("taskId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: "Comment cannot be empty." };
  }

  const task = await prisma.task.findUnique({ where: { id: parsed.data.taskId } });
  if (!task) return { error: "Task not found." };

  // Shared workspace: any signed-in user may comment on any task.
  await prisma.comment.create({
    data: { taskId: parsed.data.taskId, authorId: user.id, content: String(parsed.data.content).toUpperCase() },
  });

  revalidatePath(`/tasks/${parsed.data.taskId}`);
  if (task.groupId) revalidatePath(`/groups/${task.groupId}`);
  return { ok: true };
}
