import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getEnrolledSubjectIds } from "@/lib/enrollment";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return Response.json({ error: "Not logged in" });
  }

  const enrolledIds = await getEnrolledSubjectIds(user.id);

  const tasks = await prisma.task.findMany({
    where: enrolledIds.length > 0 ? { subjectId: { in: enrolledIds } } : { subjectId: { in: ["__NONE__"] } },
    select: { id: true, title: true, subjectId: true },
  });

  return Response.json({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    enrolledCount: enrolledIds.length,
    enrolledIds,
    taskCount: tasks.length,
    tasks,
  });
}
