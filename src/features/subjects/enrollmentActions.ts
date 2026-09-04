"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendEnrollmentEmail } from "@/lib/email";

export async function enrollSubjectAction(subjectId: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  if (typeof subjectId !== "string" || !subjectId) return;

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return;

  // Detect if this is a *new* enrollment so we don't send spurious emails
  // (e.g. on double-click or when already enrolled / when owner).
  const already = await prisma.userEnrollment.findUnique({
    where: { userId_subjectId: { userId: user.id, subjectId } },
    select: { id: true },
  });
  const isNew = !already && subject.userId !== user.id;

  await prisma.userEnrollment.upsert({
    where: { userId_subjectId: { userId: user.id, subjectId } },
    update: {},
    create: { userId: user.id, subjectId },
  });

  if (isNew) {
    if (user.email) {
      await sendEnrollmentEmail({
        to: user.email,
        userName: user.name ?? "Student",
        subjectName: subject.name,
        action: "enrolled",
      });
    }
    if (subject.userId !== user.id) {
      const owner = await prisma.user.findUnique({
        where: { id: subject.userId },
        select: { email: true, name: true },
      });
      if (owner?.email) {
        await sendEnrollmentEmail({
          to: owner.email,
          userName: owner.name ?? "Professor",
          subjectName: subject.name,
          action: "enrolled",
        });
      }
    }
  }

  revalidatePath("/subjects");
  revalidatePath(`/subjects/${subjectId}`);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function unenrollSubjectAction(subjectId: string): Promise<void> {
  const user = await requireUser();
  if (!user) return;
  if (typeof subjectId !== "string" || !subjectId) return;

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return;

  // Owners are always considered enrolled in their own subject; blocking the
  // unenroll keeps server state consistent with the UI (no enroll button for
  // the owner) and prevents a self-inflicted "invisible own subject" state.
  if (subject.userId === user.id) return;

  const deleted = await prisma.userEnrollment.deleteMany({
    where: { userId: user.id, subjectId },
  });

  // Only notify when an enrollment actually existed.
  if (deleted.count > 0) {
    if (user.email) {
      await sendEnrollmentEmail({
        to: user.email,
        userName: user.name ?? "Student",
        subjectName: subject.name,
        action: "unenrolled",
      });
    }
    // Symmetric with enroll: the subject owner hears that someone left.
    if (subject.userId !== user.id) {
      const owner = await prisma.user.findUnique({
        where: { id: subject.userId },
        select: { email: true, name: true },
      });
      if (owner?.email) {
        await sendEnrollmentEmail({
          to: owner.email,
          userName: owner.name ?? "Professor",
          subjectName: subject.name,
          action: "unenrolled",
        });
      }
    }
  }

  revalidatePath("/subjects");
  revalidatePath(`/subjects/${subjectId}`);
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}
