import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { SubjectsView } from "@/components/subjects/SubjectsView";

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [subjects, enrollments] = await Promise.all([
    prisma.subject.findMany({
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.userEnrollment.findMany({
      where: { userId: user.id },
      select: { subjectId: true },
    }),
  ]);

  const enrolledIds = enrollments.map((e) => e.subjectId);

  return <SubjectsView subjects={subjects} enrolledIds={enrolledIds} />;
}
