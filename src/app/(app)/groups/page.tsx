import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { GroupsView } from "@/components/groups/GroupsView";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);

  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    include: { _count: { select: { members: true, tasks: true } } },
    orderBy: { name: "asc" },
  });

  return <GroupsView groups={groups} />;
}
