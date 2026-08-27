import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEnrolledSubjectIds, enrolledFilter, enrolledSubjectFilter } from "@/lib/enrollment";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;

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
