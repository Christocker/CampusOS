import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEnrolledSubjectIds, enrolledFilter, enrolledSubjectFilter } from "@/lib/enrollment";
import { TasksView } from "@/components/tasks/TasksView";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

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
