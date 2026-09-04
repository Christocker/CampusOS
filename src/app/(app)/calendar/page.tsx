import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import {
  getUsableSubjectIds,
  visibleTaskFilter,
} from "@/lib/enrollment";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  const usableIds = await getUsableSubjectIds(user.id);

  const [tasks, events, subjects] = await Promise.all([
    prisma.task.findMany({
      where: { deadline: { not: null }, ...visibleTaskFilter(user.id, usableIds) },
      include: { subject: true },
    }),
    // A user's calendar shows their own events (not everyone's).
    prisma.calendarEvent.findMany({ where: { userId: user.id } }),
    prisma.subject.findMany({
      where: { id: { in: usableIds } },
      orderBy: { name: "asc" },
    }),
  ]);

  return <CalendarView tasks={tasks} events={events} subjects={subjects} />;
}
