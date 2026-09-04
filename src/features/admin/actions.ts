"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, type SessionUser } from "@/lib/session";
import type { ActionState } from "@/features/shared/validations";

async function getAdmin(): Promise<
  { admin: SessionUser } | { error: string }
> {
  const admin = await requireUser();
  if (!admin) return { error: "Session expired." };
  if (admin.role !== "ADMIN") return { error: "Only an admin can do that." };
  return { admin };
}

export async function deleteUserAction(id: string): Promise<ActionState> {
  const res = await getAdmin();
  if ("error" in res) return { error: res.error };
  const admin = res.admin;
  if (typeof id !== "string" || !id) return { error: "Invalid user." };
  if (id === admin.id) {
    return { error: "You cannot delete your own account." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: {
      ownedGroups: { select: { name: true } },
      subjects: { select: { name: true } },
    },
  });
  if (!target) return { error: "User not found." };
  // Protect shared data: groups they own would cascade-delete memberships
  // and shared tasks other students rely on. Transfer or delete first.
  if (target.ownedGroups.length > 0) {
    return {
      error: `${target.name} owns ${target.ownedGroups.length} group(s) (${target.ownedGroups
        .map((g) => g.name)
        .join(", ")}). Transfer or delete those groups before deleting the user.`,
    };
  }
  if (target.subjects.length > 0) {
    return {
      error: `${target.name} created ${target.subjects.length} subject(s), whose tasks/enrollments would be deleted. Remove those subjects first.`,
    };
  }
  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { error: "Cannot delete the only remaining admin." };
    }
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function changeUserRoleAction(
  id: string,
  role: "STUDENT" | "ADMIN",
): Promise<ActionState> {
  const res = await getAdmin();
  if ("error" in res) return { error: res.error };
  const admin = res.admin;
  if (typeof id !== "string" || !id) return { error: "Invalid user." };
  if (role !== "STUDENT" && role !== "ADMIN") return { error: "Invalid role." };
  if (id === admin.id) {
    return { error: "You cannot change your own role." };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  if (target.role === "ADMIN" && role === "STUDENT") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { error: "Cannot demote the only remaining admin." };
    }
  }

  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteInviteCodeAction(id: string): Promise<ActionState> {
  const res = await getAdmin();
  if ("error" in res) return { error: res.error };
  if (typeof id !== "string" || !id) return { error: "Invalid code." };
  const existing = await prisma.inviteCode.findUnique({ where: { id } });
  if (!existing) return { error: "Code not found." };
  await prisma.inviteCode.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateInviteCodeLabelAction(
  id: string,
  label: string,
): Promise<ActionState> {
  const res = await getAdmin();
  if ("error" in res) return { error: res.error };
  if (typeof id !== "string" || !id) return { error: "Invalid code." };
  const safeLabel = String(label ?? "").trim().slice(0, 60);
  const existing = await prisma.inviteCode.findUnique({ where: { id } });
  if (!existing) return { error: "Code not found." };
  await prisma.inviteCode.update({
    where: { id },
    data: { label: safeLabel || null },
  });
  revalidatePath("/admin");
  return { ok: true };
}
