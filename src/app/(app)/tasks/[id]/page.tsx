import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import {
  getUsableSubjectIds,
} from "@/lib/enrollment";
import { TaskDetail } from "@/components/tasks/TaskDetail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return <SessionExpired />;

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

  // Access control: owner, someone enrolled in the task's subject, or a
  // member of the task's group may view it.
  if (task.userId !== user.id) {
    let visible = false;
    if (task.groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: task.groupId, userId: user.id } },
        select: { id: true },
      });
      visible = Boolean(membership);
    }
    if (!visible && task.subjectId) {
      const enrollment = await prisma.userEnrollment.findUnique({
        where: { userId_subjectId: { userId: user.id, subjectId: task.subjectId } },
        select: { id: true },
      });
      visible = Boolean(enrollment);
    }
    if (!visible) return notFound();
  }

  const usableIds = await getUsableSubjectIds(user.id);
  const [subjects, completions] = await Promise.all([
    prisma.subject.findMany({
      where: { id: { in: usableIds } },
      orderBy: { name: "asc" },
    }),
    prisma.taskCompletion.findMany({
      where: { taskId: id },
      select: { userId: true, completed: true },
    }),
  ]);

  const completionMap = new Map(completions.map((c) => [c.userId, c.completed]));

  return (
    <TaskDetail
      task={task}
      subjects={subjects}
      completionMap={completionMap}
      currentUserId={user.id}
    />
  );
}
