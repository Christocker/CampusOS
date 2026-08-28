import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { getEnrolledSubjectIds, enrolledFilter, enrolledSubjectFilter } from "@/lib/enrollment";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const enrolledIds = await getEnrolledSubjectIds(user.id);

  const [tasks, events, subjects] = await Promise.all([
    prisma.task.findMany({
      where: { deadline: { not: null }, ...enrolledFilter(enrolledIds) },
      include: { subject: true },
    }),
    prisma.calendarEvent.findMany({}),
    prisma.subject.findMany({
      where: enrolledSubjectFilter(enrolledIds),
      orderBy: { name: "asc" },
    }),
  ]);

  return <CalendarView tasks={tasks} events={events} subjects={subjects} />;
}
