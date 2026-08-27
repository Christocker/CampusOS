"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateEmailAction, type ProfileState } from "@/features/profile/actions";

const initial: ProfileState = {};

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState(updateEmailAction, initial);
  const [email, setEmail] = useState(currentEmail);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [state.ok]);

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
          />
        </div>
        <Button type="submit" loading={pending} size="sm">
          {saved ? <Check className="size-4" /> : "Save"}
        </Button>
      </form>
      {state.error && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-2 text-xs text-success">Email updated.</p>
      )}
    </div>
  );
}
