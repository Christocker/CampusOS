import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { getEnrolledSubjectIds, enrolledSubjectFilter } from "@/lib/enrollment";
import { ProgressTracker } from "@/components/progress/ProgressTracker";

export default async function ProgressPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const enrolledIds = await getEnrolledSubjectIds(user.id);

  const [subjects, users, tasks, completions] = await Promise.all([
    prisma.subject.findMany({
      where: enrolledSubjectFilter(enrolledIds),
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, image: true },
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: enrolledIds.length > 0 ? { subjectId: { in: enrolledIds } } : { subjectId: { in: ["__NONE__"] } },
      select: { id: true, title: true, subjectId: true, userId: true, deadline: true, priority: true },
    }),
    prisma.taskCompletion.findMany({
      select: { taskId: true, userId: true, completed: true },
    }),
  ]);

  const completionMap = new Map(completions.map((c) => [`${c.taskId}:${c.userId}`, c.completed]));

  return (
    <ProgressTracker
      subjects={subjects}
      users={users}
      tasks={tasks}
      completionMap={completionMap}
      currentUserId={user.id}
    />
  );
}
