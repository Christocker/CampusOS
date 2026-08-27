"use client";

import { useActionState, useTransition, useState, useRef, useEffect } from "react";
import { Copy, Check, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createInviteCodeAction } from "@/features/auth/inviteActions";
import {
  deleteInviteCodeAction,
  updateInviteCodeLabelAction,
} from "@/features/admin/actions";
import type { ActionState } from "@/features/shared/validations";
import type { InviteCode } from "@prisma/client";

const initial: ActionState = {};

export function InviteManager({
  codes,
}: {
  codes: (InviteCode & { usedBy: { name: string } | null })[];
}) {
  const [state, formAction, pending] = useActionState(
    createInviteCodeAction,
    initial,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const active = codes;

  return (
    <div className="space-y-6">
      <form action={formAction} className="card space-y-3 p-4">
        <div>
          <Label htmlFor="label">Label (who is this for?)</Label>
          <Input
            id="label"
            name="label"
            placeholder="e.g. For Alice"
          />
        </div>
        <Button type="submit" loading={pending}>
          <Plus className="size-4" /> Generate code
        </Button>

        {state.code && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-primary/10 p-3">
            <div>
              <p className="text-xs font-medium text-ink-muted">
                Share this code
              </p>
              <p className="font-mono text-lg font-semibold tracking-widest text-primary">
                {state.code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copy("new", state.code!)}
              className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary"
              aria-label="Copy"
            >
              {copiedId === "new" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        )}
        {state.error && (
          <p className="text-sm text-danger">{state.error}</p>
        )}
      </form>

      <div>
        <h2 className="mb-2 text-base font-semibold">
          Active codes ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-ink-muted">No active codes.</p>
        ) : (
          <div className="divide-y divide-border-light rounded-2xl bg-card-light dark:divide-border-dark dark:bg-card-dark">
            {active.map((c) => (
              <CodeRow
                key={c.id}
                code={c}
                copiedId={copiedId}
                onCopy={copy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CodeRow({
  code,
  copiedId,
  onCopy,
}: {
  code: InviteCode & { usedBy: { name: string } | null };
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(code.label ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const saveLabel = () => {
    setEditing(false);
    if (label !== (code.label ?? "")) {
      startTransition(() => updateInviteCodeLabelAction(code.id, label));
    }
  };

  const handleDelete = () => {
    if (!confirm("Delete this code?")) return;
    startTransition(() => deleteInviteCodeAction(code.id));
  };

  return (
    <div className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm font-semibold tracking-widest">
            {code.code}
          </p>
          <button
            type="button"
            onClick={() => onCopy(code.id, code.code)}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-ink/5 hover:text-ink dark:hover:bg-ink-inverse/10"
            aria-label="Copy code"
          >
            {copiedId === code.id ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
        {editing ? (
          <div className="mt-1 flex items-center gap-1">
            <input
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveLabel();
                if (e.key === "Escape") {
                  setLabel(code.label ?? "");
                  setEditing(false);
                }
              }}
              className="w-full rounded-lg border border-primary bg-white px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary dark:bg-card-dark"
              placeholder="Label..."
            />
          </div>
        ) : (
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            {code.label ? (
              <>
                {code.label}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-ink-muted/50 transition hover:text-ink-muted"
                  aria-label="Edit label"
                >
                  <Pencil className="size-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-ink-muted/50 transition hover:text-ink-muted"
              >
                + Add label
              </button>
            )}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-medium text-success">
          Active
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex size-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          aria-label="Delete code"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
