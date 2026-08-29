import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { BottomNav } from "@/components/layout/BottomNav";
import { RealtimeProvider } from "@/components/layout/RealtimeProvider";
import type { Subject } from "@prisma/client";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  let subjects: Subject[] = [];
  if (user) {
    const enrollmentSubjectIds = await prisma.userEnrollment.findMany({
      where: { userId: user.id },
      select: { subjectId: true },
    }).then((e) => e.map((x) => x.subjectId));

    if (enrollmentSubjectIds.length > 0) {
      subjects = await prisma.subject.findMany({
        where: { id: { in: enrollmentSubjectIds } },
        orderBy: { name: "asc" },
      });
    }
  }

  return (
    <RealtimeProvider>
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
        <BottomNav subjects={subjects} />
      </div>
    </RealtimeProvider>
  );
}
