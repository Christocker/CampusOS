"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { userCanUseSubject } from "@/lib/enrollment";
import { parseLocalIso } from "@/lib/datetime";
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
    name: String(formData.get("name") ?? "").trim().toUpperCase(),
    description: String(formData.get("description") ?? "").trim().toUpperCase(),
  });

  if (!parsed.success) {
    return { error: "Check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
  });

  revalidatePath("/groups");
  return { ok: true };
}

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

export async function addMemberAction(
  groupId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof groupId !== "string" || !groupId) return { error: "Invalid group." };
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  // Any member (incl. owner) may invite — shared study-group model.
  if (!group || !group.members.some((m) => m.userId === user.id)) {
    return { error: "Only group members can add members." };
  }

  const parsedEmail = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsedEmail.success) {
    return { error: "Enter a valid email address." };
  }

  const invitee = await prisma.user.findUnique({
    where: { email: parsedEmail.data },
  });
  if (!invitee) return { error: "No user with that email exists yet." };

  const already = group.members.some((m) => m.userId === invitee.id);
  if (already) return { error: "User is already a member." };

  try {
    await prisma.groupMember.create({
      data: { groupId, userId: invitee.id, role: "MEMBER" },
    });
  } catch (err) {
    console.error("[Groups] add member failed:", err);
    return { error: "Failed to add member. Please try again." };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { ok: true };
}

export async function removeMemberAction(
  groupId: string,
  memberUserId: string,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof groupId !== "string" || typeof memberUserId !== "string") {
    return { error: "Invalid request." };
  }
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== user.id) {
    return { error: "Only the group owner can remove members." };
  }
  if (memberUserId === user.id) return { error: "You cannot remove yourself." };

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberUserId } },
    select: { id: true },
  });
  if (!membership) return { error: "That user is not a member of this group." };

  await prisma.groupMember.delete({ where: { id: membership.id } });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { ok: true };
}

/**
 * Hand ownership to another member. The only graceful way for an owner to
 * step down (instead of deleting the whole group).
 */
export async function transferGroupOwnershipAction(
  groupId: string,
  newOwnerUserId: string,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof groupId !== "string" || typeof newOwnerUserId !== "string") {
    return { error: "Invalid request." };
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group || group.ownerId !== user.id) {
    return { error: "Only the group owner can transfer ownership." };
  }
  if (newOwnerUserId === user.id) {
    return { error: "You are already the owner." };
  }
  if (!group.members.some((m) => m.userId === newOwnerUserId)) {
    return { error: "The new owner must be a member of the group." };
  }

  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: { ownerId: newOwnerUserId },
    }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerUserId } },
      data: { role: "ADMIN" },
    }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: user.id } },
      data: { role: "MEMBER" },
    }),
  ]);

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { ok: true };
}

export async function leaveGroupAction(groupId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof groupId !== "string" || !groupId) return { error: "Invalid group." };

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Group not found." };
  if (group.ownerId === user.id) {
    return { error: "As the owner, delete the group instead of leaving it." };
  }

  await prisma.groupMember.deleteMany({
    where: { groupId, userId: user.id },
  });
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function deleteGroupAction(groupId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof groupId !== "string" || !groupId) return { error: "Invalid group." };

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Group not found." };
  if (group.ownerId !== user.id) {
    return { error: "Only the group owner can delete the group." };
  }

  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
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
    title: String(formData.get("title") ?? "").trim().toUpperCase(),
    description: String(formData.get("description") ?? "").trim().toUpperCase(),
    subjectId: String(formData.get("subjectId") ?? "").trim(),
    status: String(formData.get("status") ?? "NOT_STARTED"),
    priority: String(formData.get("priority") ?? "MEDIUM"),
    deadline: "",
  });

  if (!parsed.success) {
    return { error: "Check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { title, description, status, priority, subjectId } = parsed.data;

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return { error: "Invalid subject." };
    if (!(await userCanUseSubject(user.id, subject))) {
      return { error: "You are not enrolled in that subject." };
    }
  }

  const deadline = parseLocalIso(formData.get("deadline"), formData.get("tzOffset"), "end-of-day");

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      status,
      priority,
      deadline,
      subjectId: subjectId || null,
      userId: user.id,
      groupId,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  if (subjectId) revalidatePath(`/subjects/${subjectId}`);
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
    content: String(formData.get("content") ?? "").trim(),
  });

  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
    return {
      error: tooLong
        ? "Comment is too long (max 1000 characters)."
        : "Comment cannot be empty.",
    };
  }

  const task = await prisma.task.findUnique({ where: { id: parsed.data.taskId } });
  if (!task) return { error: "Task not found." };

  // Commenting is allowed for anyone who can see the task:
  //  - group tasks: group members only
  //  - subject tasks: enrolled users (or subject owner)
  //  - personal tasks: creator only
  if (task.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: task.groupId, userId: user.id } },
      select: { id: true },
    });
    if (!membership) return { error: "Only group members can comment here." };
  } else if (task.userId !== user.id) {
    if (task.subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: task.subjectId } });
      const allowed = subject && (await userCanUseSubject(user.id, subject));
      if (!allowed) return { error: "You cannot comment on this task." };
    } else {
      return { error: "You cannot comment on this task." };
    }
  }

  await prisma.comment.create({
    data: {
      taskId: parsed.data.taskId,
      authorId: user.id,
      content: parsed.data.content.toUpperCase(),
    },
  });

  revalidatePath(`/tasks/${parsed.data.taskId}`);
  if (task.groupId) revalidatePath(`/groups/${task.groupId}`);
  return { ok: true };
}
