import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { GroupDetail } from "@/components/groups/GroupDetail";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

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

  return (
    <GroupDetail
      group={group}
      members={group.members}
      tasks={group.tasks}
      isOwner={group.ownerId === user.id}
      subjects={[]}
    />
  );
}
