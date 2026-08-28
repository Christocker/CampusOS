import Link from "next/link";
import { Plus, BookOpen, ListTodo, CalendarClock, Trophy, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEnrolledSubjectIds, enrolledFilter } from "@/lib/enrollment";
import { greeting } from "@/lib/utils";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Reveal } from "@/components/layout/Reveal";
import { TaskCard } from "@/components/tasks/TaskCard";
import { SubjectCard } from "@/components/subjects/SubjectCard";
import { ProgressWidget } from "@/components/dashboard/ProgressWidget";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const enrolledIds = await getEnrolledSubjectIds(user.id);
  const taskFilter = enrolledFilter(enrolledIds);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(startOfToday.getDate() + 1);
  const weekHorizon = new Date(startOfToday);
  weekHorizon.setDate(startOfToday.getDate() + 8);

  const [tasks, subjects] = await Promise.all([
    prisma.task.findMany({
      where: taskFilter,
      include: { subject: true, user: { select: { name: true } } },
      orderBy: { deadline: "asc" },
    }),
    prisma.subject.findMany({
      where: enrolledIds.length > 0 ? { id: { in: enrolledIds } } : { id: { in: ["__NONE__"] } },
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const active = tasks.filter((t) => t.status !== "COMPLETED");
  const completed = tasks.filter((t) => t.status === "COMPLETED");

  const todayList = active
    .filter((t) => t.deadline && t.deadline >= startOfToday && t.deadline <= endOfToday)
    .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0));
  const overdue = active.filter((t) => t.deadline && t.deadline < startOfToday);
  const todays = [...overdue, ...todayList];

  const upcoming = active
    .filter((t) => t.deadline && t.deadline > endOfToday && t.deadline <= weekHorizon)
    .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0));

  const progressValue = tasks.length ? (completed.length / tasks.length) * 100 : 0;

  return (
    <div>
      <ScreenHeader
        title={`${greeting(now)}, ${(user.name ?? "there").split(" ")[0]} 👋`}
        subtitle={now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        action={
          <Link href="/profile" className="flex size-10 items-center justify-center rounded-full bg-ink/5 text-ink transition hover:bg-ink/10 dark:bg-ink-inverse/10 dark:text-ink-inverse dark:hover:bg-ink-inverse/15">
            <User className="size-5" />
          </Link>
        }
      />

      <Reveal delay={0.05}>
        <ProgressWidget
          value={progressValue}
          total={tasks.length}
          completed={completed.length}
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ListTodo className="size-4 text-primary" /> Today &amp; Overdue
          </h2>
          <Link href="/tasks" className="text-xs font-medium text-primary">
            See all
          </Link>
        </div>
        {todays.length ? (
          <div className="space-y-2.5">
            {todays.slice(0, 5).map((t) => (
              <TaskCard key={t.id} task={t} href={`/tasks/${t.id}`} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ListTodo className="size-5" />}
            title="Nothing due right now"
            description={enrolledIds.length === 0 ? "Enroll in a subject to get started." : "You're all caught up."}
          />
        )}
      </Reveal>

      {upcoming.length > 0 && (
        <Reveal delay={0.15} className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="size-4 text-primary" /> Upcoming
          </div>
          <div className="space-y-2.5">
            {upcoming.slice(0, 4).map((t) => (
              <TaskCard key={t.id} task={t} href={`/tasks/${t.id}`} />
            ))}
          </div>
        </Reveal>
      )}

      <Reveal delay={0.2} className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BookOpen className="size-4 text-primary" /> Your subjects
          </h2>
          <Link href="/subjects" className="text-xs font-medium text-primary">
            Manage
          </Link>
        </div>
        {subjects.length ? (
          <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
            {subjects.slice(0, 4).map((s) => (
              <SubjectCard key={s.id} subject={s} enrolled canToggle={false} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="size-5" />}
            title="No subjects enrolled"
            description="Enroll in subjects to start organizing your tasks."
            action={
              <Link href="/subjects">
                <Button size="sm">
                  <Plus className="size-4" /> Browse subjects
                </Button>
              </Link>
            }
          />
        )}
      </Reveal>

    </div>
  );
}
