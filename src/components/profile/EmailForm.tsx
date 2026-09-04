"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateEmailAction, type ProfileState } from "@/features/profile/actions";

const initial: ProfileState = {};

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState(updateEmailAction, initial);
  const [email, setEmail] = useState(currentEmail);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setEmail(currentEmail);
  }, [currentEmail]);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      router.refresh();
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state.ok, router]);

  const unchanged = email.trim().toLowerCase() === currentEmail.trim().toLowerCase();

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Email for notifications</h3>
      </div>
      <p className="mb-3 text-xs text-ink-muted">
        Update your email to receive enrollment and task notifications.
      </p>
      <form action={formAction} className="flex gap-2">
        <div className="flex-1">
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            maxLength={254}
          />
        </div>
        <Button type="submit" loading={pending} size="sm" disabled={unchanged}>
          {saved ? <Check className="size-4" /> : "Save"}
        </Button>
      </form>
      {state.error && !saved && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}
      {saved && (
        <p className="mt-2 text-xs text-success">Email updated.</p>
      )}
    </div>
  );
}
