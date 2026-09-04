import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { SubjectDetail } from "@/components/subjects/SubjectDetail";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) return notFound();

  // The subject catalog is intentionally shared, but only the owner may
  // edit/delete; tasks carry the acting user's completion state.
  const [tasks, completions] = await Promise.all([
    prisma.task.findMany({
      where: { subjectId: id },
      include: { subject: true, user: { select: { name: true } } },
      orderBy: { deadline: "asc" },
    }),
    prisma.taskCompletion.findMany({
      where: { userId: user.id },
      select: { taskId: true, completed: true },
    }),
  ]);

  const completionMap = new Map(completions.map((c) => [c.taskId, c.completed]));
  const enrolled = await prisma.userEnrollment.findUnique({
    where: { userId_subjectId: { userId: user.id, subjectId: id } },
    select: { id: true },
  });

  return (
    <SubjectDetail
      subject={subject}
      tasks={tasks}
      completionMap={completionMap}
      isOwner={subject.userId === user.id}
      enrolled={Boolean(enrolled) || subject.userId === user.id}
    />
  );
}
