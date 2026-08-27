import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEnrolledSubjectIds, enrolledSubjectFilter } from "@/lib/enrollment";
import { ProgressTracker } from "@/components/progress/ProgressTracker";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const enrolledIds = await getEnrolledSubjectIds(user.id);

  const [subjects, users, tasks] = await Promise.all([
    prisma.subject.findMany({
      where: enrolledSubjectFilter(enrolledIds),
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, image: true },
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: enrolledIds.length > 0 ? { subjectId: { in: enrolledIds } } : { subjectId: { in: ["__NONE__"] } },
      select: { id: true, title: true, subjectId: true, userId: true, status: true },
    }),
  ]);

  return (
    <ProgressTracker
      subjects={subjects}
      users={users}
      tasks={tasks}
      currentUserId={user.id}
    />
  );
}
