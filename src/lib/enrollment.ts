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

/** Returns a Prisma filter that matches only enrolled subjects, or nothing if none enrolled. */
export function enrolledFilter(enrolledIds: string[]): { subjectId: { in: string[] } } | { subjectId: { in: string[] } } {
  if (enrolledIds.length === 0) {
    return { subjectId: { in: ["__NONE__"] } };
  }
  return { subjectId: { in: enrolledIds } };
}

/** Returns a Prisma filter for subjects by ID, or nothing if none enrolled. */
export function enrolledSubjectFilter(enrolledIds: string[]): { id: { in: string[] } } | { id: { in: string[] } } {
  if (enrolledIds.length === 0) {
    return { id: { in: ["__NONE__"] } };
  }
  return { id: { in: enrolledIds } };
}
