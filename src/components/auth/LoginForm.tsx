"use client";

import { useActionState, useState } from "react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  loginAction,
  loginWithCodeAction,
  type ActionState,
} from "@/features/auth/actions";

const initial: ActionState = {};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [mode, setMode] = useState<"admin" | "code">("admin");
  const [adminState, adminAction, adminPending] = useActionState(
    loginAction,
    initial,
  );
  const [codeState, codeAction, codePending] = useActionState(
    loginWithCodeAction,
    initial,
  );

  const state = mode === "admin" ? adminState : codeState;
  const action = mode === "admin" ? adminAction : codeAction;
  const pending = mode === "admin" ? adminPending : codePending;

  return (
    <div className="space-y-5">
      <div className="flex rounded-xl bg-ink/5 p-1 dark:bg-ink-inverse/10">
        <button
          type="button"
          onClick={() => setMode("admin")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "admin"
              ? "bg-card-light text-ink shadow-sm dark:bg-card-dark"
              : "text-ink-muted"
          }`}
        >
          Admin sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === "code"
              ? "bg-card-light text-ink shadow-sm dark:bg-card-dark"
              : "text-ink-muted"
          }`}
        >
          Sign in with code
        </button>
      </div>

      {mode === "admin" ? (
        <form action={action} className="space-y-4">
          {callbackUrl && (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@school.edu"
            />
            {adminState.fieldErrors?.email && (
              <p className="mt-1 text-xs text-danger">
                {adminState.fieldErrors.email[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
            {adminState.fieldErrors?.password && (
              <p className="mt-1 text-xs text-danger">
                {adminState.fieldErrors.password[0]}
              </p>
            )}
          </div>
          {adminState.error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {adminState.error}
            </p>
          )}
          <Button type="submit" loading={pending} size="lg" className="w-full">
            Sign in
          </Button>
        </form>
      ) : (
        <form action={action} className="space-y-4">
          {callbackUrl && (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          )}
          <div>
            <Label htmlFor="code">Access code</Label>
            <Input
              id="code"
              name="code"
              placeholder="e.g. A1B2C3D4"
              autoCapitalize="characters"
              maxLength={32}
              required
            />
            <p className="mt-1 text-xs text-ink-muted">
              Get this code from your admin.
            </p>
          </div>
          {codeState.error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {codeState.error}
            </p>
          )}
          <Button type="submit" loading={pending} size="lg" className="w-full">
            Sign in
          </Button>
        </form>
      )}
    </div>
  );
}
