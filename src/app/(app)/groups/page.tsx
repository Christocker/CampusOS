import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { GroupsView } from "@/components/groups/GroupsView";

export default async function GroupsPage() {
  const user = await requireUser();

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
