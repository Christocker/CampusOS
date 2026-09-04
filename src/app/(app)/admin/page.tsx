import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { InviteManager } from "@/components/auth/InviteManager";
import { UserManager } from "@/components/admin/UserManager";
import { Users, ListTodo, BookOpen, KeyRound } from "lucide-react";

export default async function AdminPage() {
  const user = await requireUser();
  if (!user) return <SessionExpired />;
  if (user.role !== "ADMIN") redirect("/");

  const [totalUsers, totalTasks, totalSubjects, codes, users] =
    await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.subject.count(),
      prisma.inviteCode.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      // Never send passwordHash to the client.
      prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true },
      }),
    ]);

  const usedCodes = codes.filter((c) => c.userId !== null).length;
  const unusedCodes = codes.length - usedCodes;

  const stats = [
    { label: "Users", value: totalUsers, icon: Users },
    { label: "Tasks", value: totalTasks, icon: ListTodo },
    { label: "Subjects", value: totalSubjects, icon: BookOpen },
    { label: "Codes", value: codes.length, icon: KeyRound },
  ];

  return (
    <div className="space-y-8">
      <ScreenHeader title="Admin" subtitle="Manage your workspace" />

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-ink-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Access codes</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Share a code with a classmate so they can sign in. Codes can be used
          unlimited times until deleted or expired ({usedCodes} in use,{" "}
          {unusedCodes} unused).
        </p>
        <InviteManager codes={codes} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Users ({users.length})</h2>
        <UserManager users={users} currentUserId={user.id} />
      </section>
    </div>
  );
}
