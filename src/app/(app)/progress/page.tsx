import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { getUsableSubjectIds } from "@/lib/enrollment";
import { ProgressTracker } from "@/components/progress/ProgressTracker";

export default async function ProgressPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const usableIds = await getUsableSubjectIds(user.id);

  const [subjects, users, tasks, completions, enrollments] = await Promise.all([
    // Subjects the viewer participates in (enrolled ∪ owned) drive the breakdown.
    prisma.subject.findMany({
      where: { id: { in: usableIds } },
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: "asc" },
    }),
    // All users: a task's assignee must always be resolvable on the board.
    prisma.user.findMany({
      select: { id: true, name: true, image: true },
      orderBy: { name: "asc" },
    }),
    // Full task list — leaderboard counts must not depend on who is viewing.
    prisma.task.findMany({
      select: { id: true, title: true, subjectId: true, userId: true, deadline: true, priority: true },
    }),
    prisma.taskCompletion.findMany({
      select: { taskId: true, userId: true, completed: true },
    }),
    prisma.userEnrollment.findMany({
      select: { userId: true, subjectId: true },
    }),
  ]);

  const completionMap = new Map(completions.map((c) => [`${c.taskId}:${c.userId}`, c.completed]));

  return (
    <ProgressTracker
      subjects={subjects}
      users={users}
      tasks={tasks}
      completionMap={completionMap}
      enrollments={enrollments}
      currentUserId={user.id}
    />
  );
}
