"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { subjectSchema, type ActionState } from "@/features/shared/validations";

function parseSubjectForm(formData: FormData) {
  return subjectSchema.safeParse({
    name: String(formData.get("name") ?? "").trim().toUpperCase(),
    classCode: String(formData.get("classCode") ?? "").trim().toUpperCase(),
    professor: String(formData.get("professor") ?? "").trim().toUpperCase(),
    semester: String(formData.get("semester") ?? "").trim(),
    color: String(formData.get("color") ?? "#007AFF"),
    description: String(formData.get("description") ?? "").trim().toUpperCase(),
  });
}

function fieldError(parsed: ReturnType<typeof parseSubjectForm>): ActionState {
  if (parsed.success) return { error: "Please check the form." };
  const flat = parsed.error.flatten();
  return {
    error:
      flat.fieldErrors.name?.[0] ??
      flat.fieldErrors.classCode?.[0] ??
      flat.fieldErrors.color?.[0] ??
      flat.fieldErrors.professor?.[0] ??
      flat.fieldErrors.semester?.[0] ??
      flat.fieldErrors.description?.[0] ??
      "Please check the form.",
    fieldErrors: flat.fieldErrors,
  };
}

export async function createSubjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };

  const parsed = parseSubjectForm(formData);
  if (!parsed.success) return fieldError(parsed);
  const { name, classCode, professor, semester, color, description } = parsed.data;

  try {
    await prisma.subject.create({
      data: {
        name,
        classCode: classCode || null,
        professor: professor || null,
        semester: semester || null,
        color,
        description: description || null,
        userId: user.id,
        // The creator is auto-enrolled so their own subject appears in
        // their enrolled views and task forms immediately.
        enrollments: {
          create: { userId: user.id },
        },
      },
    });
  } catch (err) {
    console.error("[Subjects] create failed:", err);
    return { error: "Failed to create subject. Please try again." };
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  return { ok: true };
}

export async function updateSubjectAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof id !== "string" || !id) return { error: "Invalid subject." };

  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return { error: "Subject not found." };
  if (existing.userId !== user.id) {
    return { error: "You can only edit subjects you created." };
  }

  const parsed = parseSubjectForm(formData);
  if (!parsed.success) return fieldError(parsed);
  const { name, classCode, professor, semester, color, description } = parsed.data;

  try {
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
  } catch (err) {
    console.error("[Subjects] update failed:", err);
    return { error: "Failed to update subject. Please try again." };
  }

  revalidatePath("/subjects");
  revalidatePath(`/subjects/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteSubjectAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  if (typeof id !== "string" || !id) return { error: "Invalid subject." };

  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return { error: "Subject not found." };
  if (existing.userId !== user.id) {
    return { error: "You can only delete subjects you created." };
  }

  try {
    await prisma.subject.delete({ where: { id } });
  } catch (err) {
    console.error("[Subjects] delete failed:", err);
    return { error: "Failed to delete subject. Please try again." };
  }

  revalidatePath("/subjects");
  revalidatePath(`/subjects/${id}`);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return { ok: true };
}
