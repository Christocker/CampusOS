"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function enrollSubjectAction(subjectId: string): Promise<void> {
  const user = await requireUser();
  await prisma.userEnrollment.upsert({
    where: { userId_subjectId: { userId: user.id, subjectId } },
    update: {},
    create: { userId: user.id, subjectId },
  });
  revalidatePath("/subjects");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function unenrollSubjectAction(subjectId: string): Promise<void> {
  const user = await requireUser();
  await prisma.userEnrollment.deleteMany({
    where: { userId: user.id, subjectId },
  });
  revalidatePath("/subjects");
  revalidatePath("/");
  revalidatePath("/calendar");
}
