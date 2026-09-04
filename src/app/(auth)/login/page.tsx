import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  // Only allow same-origin relative redirect targets.
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl">
          <Image src="/icons/icon.png" alt="CampusOS" width={64} height={64} priority />
        </div>
        <h1 className="mt-4 text-[28px] font-bold tracking-tight">CampusOS</h1>
        <p className="mt-1 text-note-body text-ink-muted">
          Sign in to your workspace.
        </p>
      </div>
      <div className="card p-5">
        <LoginForm callbackUrl={safeCallbackUrl} />
      </div>
    </div>
  );
}
