"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { subjectSchema } from "@/features/shared/validations";

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
  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    professor: formData.get("professor") ?? "",
    semester: formData.get("semester") ?? "",
    color: formData.get("color") ?? "#007AFF",
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: "Check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, professor, semester, color, description } = parsed.data;
  const subject = await prisma.subject.create({
    data: {
      name,
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
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Subject not found." };
  }

  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    professor: formData.get("professor") ?? "",
    semester: formData.get("semester") ?? "",
    color: formData.get("color") ?? "#007AFF",
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { error: "Check the form.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, professor, semester, color, description } = parsed.data;
  await prisma.subject.update({
    where: { id },
    data: {
      name,
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
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/subjects");
  revalidatePath("/");
}
