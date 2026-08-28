import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { getEnrolledSubjectIds, enrolledFilter, enrolledSubjectFilter } from "@/lib/enrollment";
import { TasksView } from "@/components/tasks/TasksView";

export default async function TasksPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const enrolledIds = await getEnrolledSubjectIds(user.id);
  const taskFilter = enrolledFilter(enrolledIds);

  const [tasks, subjects] = await Promise.all([
    prisma.task.findMany({
      where: taskFilter,
      include: { subject: true, user: { select: { name: true } } },
      orderBy: { deadline: "asc" },
    }),
    prisma.subject.findMany({
      where: enrolledSubjectFilter(enrolledIds),
      orderBy: { name: "asc" },
    }),
  ]);

  return <TasksView tasks={tasks} subjects={subjects} />;
}
