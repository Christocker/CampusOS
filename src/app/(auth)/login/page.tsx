import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-white">
          <GraduationCap className="size-8" />
        </div>
        <h1 className="mt-4 text-[28px] font-bold tracking-tight">CampusOS</h1>
        <p className="mt-1 text-note-body text-ink-muted">
          Sign in to your workspace.
        </p>
      </div>
      <div className="card p-5">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
