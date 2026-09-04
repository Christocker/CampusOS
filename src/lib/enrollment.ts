import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Returns the subject IDs the user is enrolled in. */
export async function getEnrolledSubjectIds(userId: string): Promise<string[]> {
  const enrollments = await prisma.userEnrollment.findMany({
    where: { userId },
    select: { subjectId: true },
  });
  return enrollments.map((e) => e.subjectId);
}

/**
 * Prisma filter for tasks a user should see in the main task surfaces:
 *  - tasks they created themselves (any subject, incl. no-subject), OR
 *  - tasks belonging to any of the user's usable subjects (enrolled in OR owned).
 *
 * Fixes the old `subjectId IN (...)` filter which silently hid tasks whose
 * subjectId was NULL (SQL `NULL IN (...)` is never true).
 *
 * NOTE: pass `usableSubjectIds` (enrolled ∪ owned) — not just enrolled ids —
 * so subject owners (e.g. the teacher who created a subject) always see the
 * work inside their own subjects.
 */
export function visibleTaskFilter(
  userId: string,
  usableSubjectIds: string[],
): Prisma.TaskWhereInput {
  const or: Prisma.TaskWhereInput[] = [{ userId }];
  if (usableSubjectIds.length > 0) {
    or.push({ subjectId: { in: usableSubjectIds } });
  }
  return { OR: or };
}

/**
 * IDs of subjects the user can use = enrolled ∪ owned.
 * Passing this (instead of raw enrolled ids) to visibleTaskFilter fixes
 * task counts that ignored an owner's own subjects.
 */
export async function getUsableSubjectIds(userId: string): Promise<string[]> {
  const subjects = await prisma.subject.findMany({
    where: { OR: [{ userId }, { enrollments: { some: { userId } } }] },
    select: { id: true },
  });
  return subjects.map((s) => s.id);
}

/** Whether a user may create/move tasks into a given subject. */
export async function userCanUseSubject(
  userId: string,
  subject: { id: string; userId: string },
): Promise<boolean> {
  if (subject.userId === userId) return true;
  const enrollment = await prisma.userEnrollment.findUnique({
    where: { userId_subjectId: { userId, subjectId: subject.id } },
    select: { id: true },
  });
  return Boolean(enrollment);
}
