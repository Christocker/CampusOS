import { getCurrentUser } from "@/lib/session";
import { getUsableSubjects } from "@/lib/enrollment";
import { BottomNav } from "@/components/layout/BottomNav";
import { RealtimeProvider } from "@/components/layout/RealtimeProvider";
import type { Subject } from "@prisma/client";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Cached per request: deduped with the dashboard which uses the same call.
  const subjects: Subject[] = user
    ? await getUsableSubjects(user.id)
    : [];

  return (
    <RealtimeProvider>
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
        <BottomNav subjects={subjects} />
      </div>
    </RealtimeProvider>
  );
}
