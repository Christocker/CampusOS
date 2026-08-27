import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEnrolledSubjectIds } from "@/lib/enrollment";
import { SubjectDetail } from "@/components/subjects/SubjectDetail";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) return notFound();

  const enrolledIds = await getEnrolledSubjectIds(user.id);
  if (!enrolledIds.includes(id)) redirect("/subjects");

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
