import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import {
  getUsableSubjectIds,
  visibleTaskFilter,
} from "@/lib/enrollment";
import { TasksView } from "@/components/tasks/TasksView";

export default async function TasksPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const usableIds = await getUsableSubjectIds(user.id);

  const [tasks, subjects, completions] = await Promise.all([
    prisma.task.findMany({
      where: visibleTaskFilter(user.id, usableIds),
      include: { subject: true, user: { select: { name: true } } },
      orderBy: { deadline: "asc" },
    }),
    prisma.subject.findMany({
      where: { id: { in: usableIds } },
      orderBy: { name: "asc" },
    }),
    prisma.taskCompletion.findMany({
      where: { userId: user.id },
      select: { taskId: true, completed: true },
    }),
  ]);

  const completionMap = new Map(completions.map((c) => [c.taskId, c.completed]));

  return <TasksView tasks={tasks} subjects={subjects} completionMap={completionMap} />;
}
