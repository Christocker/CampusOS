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

  const [tasks, subjects] = await Promise.all([
    prisma.task.findMany({
      where: { subjectId: id },
      include: { subject: true, user: { select: { name: true } } },
      orderBy: { deadline: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <SubjectDetail subject={subject} tasks={tasks} subjects={subjects} />;
}
