import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { TaskDetail } from "@/components/tasks/TaskDetail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const [task, subjects, completions] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        subject: true,
        comments: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.taskCompletion.findMany({
      where: { taskId: id },
      select: { userId: true, completed: true },
    }),
  ]);

  if (!task) return notFound();

  const completionMap = new Map(completions.map((c) => [c.userId, c.completed]));

  return <TaskDetail task={task} subjects={subjects} completionMap={completionMap} currentUserId={user.id} />;
}
