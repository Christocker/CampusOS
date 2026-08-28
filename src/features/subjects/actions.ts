"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
};

export async function createSubjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };

  const name = String(formData.get("name") ?? "").trim();
  const classCode = String(formData.get("classCode") ?? "").trim();
  const professor = String(formData.get("professor") ?? "").trim();
  const semester = String(formData.get("semester") ?? "").trim();
  const color = String(formData.get("color") ?? "#007AFF");
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const subject = await prisma.subject.create({
    data: {
      name,
      classCode: classCode || null,
      professor: professor || null,
      semester: semester || null,
      color,
      description: description || null,
      userId: user.id,
    },
  });

  revalidatePath("/subjects");
  revalidatePath("/");
  return { ok: true, ...(subject as object) };
}

export async function updateSubjectAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Subject not found." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const classCode = String(formData.get("classCode") ?? "").trim();
  const professor = String(formData.get("professor") ?? "").trim();
  const semester = String(formData.get("semester") ?? "").trim();
  const color = String(formData.get("color") ?? "#007AFF");
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  await prisma.subject.update({
    where: { id },
    data: {
      name,
      classCode: classCode || null,
      professor: professor || null,
      semester: semester || null,
      color,
      description: description || null,
    },
  });

  revalidatePath("/subjects");
  revalidatePath(`/subjects/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteSubjectAction(id: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/subjects");
  revalidatePath("/");
}
