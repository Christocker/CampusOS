import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import {
  getUsableSubjectIds,
} from "@/lib/enrollment";
import { GroupDetail } from "@/components/groups/GroupDetail";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: { include: { subject: true }, orderBy: { deadline: "asc" } },
    },
  });

  if (!group) return notFound();

  // Private-ish collaboration space: only members may view the group.
  const isMember = group.members.some((m) => m.userId === user.id);
  if (!isMember) return notFound();

  const usableIds = await getUsableSubjectIds(user.id);
  const [subjects, completions] = await Promise.all([
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

  return (
    <GroupDetail
      group={group}
      members={group.members}
      tasks={group.tasks}
      isOwner={group.ownerId === user.id}
      currentUserId={user.id}
      subjects={subjects}
      completionMap={completionMap}
    />
  );
}
