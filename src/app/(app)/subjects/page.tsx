import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { SubjectsView } from "@/components/subjects/SubjectsView";

export default async function SubjectsPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

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

  return <SubjectsView subjects={subjects} enrolledIds={enrolledIds} currentUserId={user.id} />;
}
