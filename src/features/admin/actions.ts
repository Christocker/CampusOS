"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/features/shared/validations";

export async function deleteUserAction(id: string): Promise<void> {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") return;
  if (id === admin.id) return;
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function changeUserRoleAction(
  id: string,
  role: "STUDENT" | "ADMIN",
): Promise<void> {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") return;
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin");
}

export async function deleteInviteCodeAction(id: string): Promise<void> {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") return;
  await prisma.inviteCode.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function updateInviteCodeLabelAction(
  id: string,
  label: string,
): Promise<void> {
  const admin = await requireUser();
  if (admin.role !== "ADMIN") return;
  await prisma.inviteCode.update({
    where: { id },
    data: { label: label || null },
  });
  revalidatePath("/admin");
}
