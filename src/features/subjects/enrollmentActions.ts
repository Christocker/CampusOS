"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendEnrollmentEmail } from "@/lib/email";

export async function enrollSubjectAction(subjectId: string): Promise<void> {
  const user = await requireUser();
  await prisma.userEnrollment.upsert({
    where: { userId_subjectId: { userId: user.id, subjectId } },
    update: {},
    create: { userId: user.id, subjectId },
  });

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (subject && user.email) {
    sendEnrollmentEmail({
      to: user.email,
      userName: user.name ?? "Student",
      subjectName: subject.name,
      action: "enrolled",
    });
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function unenrollSubjectAction(subjectId: string): Promise<void> {
  const user = await requireUser();

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

  await prisma.userEnrollment.deleteMany({
    where: { userId: user.id, subjectId },
  });

  if (subject && user.email) {
    sendEnrollmentEmail({
      to: user.email,
      userName: user.name ?? "Student",
      subjectName: subject.name,
      action: "unenrolled",
    });
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  revalidatePath("/calendar");
}
