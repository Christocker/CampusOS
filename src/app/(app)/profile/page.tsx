import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { initials } from "@/lib/utils";
import { BookOpen, ListTodo, CheckCircle2, Shield } from "lucide-react";
import { EmailForm } from "@/components/profile/EmailForm";
import { SignOutForm } from "@/components/profile/SignOutForm";
import { getEnrolledSubjectIds } from "@/lib/enrollment";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;

  // Personal stats, scoped to this user.
  const [enrolledIds, myTasks, myDone] = await Promise.all([
    getEnrolledSubjectIds(user.id),
    prisma.task.count({ where: { userId: user.id } }),
    prisma.taskCompletion.count({ where: { userId: user.id, completed: true } }),
  ]);

  const stats = [
    { label: "Subjects enrolled", value: enrolledIds.length, icon: BookOpen },
    { label: "My tasks", value: myTasks, icon: ListTodo },
    { label: "Completed by me", value: myDone, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4">
      <ScreenHeader title="Profile" />

      <div className="card flex flex-col items-center p-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-ink">
          {initials(user.name ?? "")}
        </div>
        <h2 className="mt-3 text-xl font-semibold">{user.name}</h2>
        <p className="text-sm text-ink-muted">{user.email}</p>
      </div>

      <EmailForm currentEmail={user.email ?? ""} />

      <div className="card divide-y divide-separator-light overflow-hidden dark:divide-separator-dark">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 px-4 py-3">
            <s.icon className="size-5 text-primary" />
            <span className="flex-1 text-note-body">{s.label}</span>
            <span className="text-note-headline">{s.value}</span>
          </div>
        ))}
      </div>

      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="card flex items-center gap-3 px-4 py-3 transition active:bg-ink/5 dark:active:bg-ink-inverse/10"
        >
          <Shield className="size-5 text-primary" />
          <span className="text-note-body font-medium">Admin Dashboard</span>
        </Link>
      )}

      <SignOutForm />
    </div>
  );
}
