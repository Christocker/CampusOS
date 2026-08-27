import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TaskDetail } from "@/components/tasks/TaskDetail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      subject: true,
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) return notFound();

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
  });

  return <TaskDetail task={task} subjects={subjects} />;
}
