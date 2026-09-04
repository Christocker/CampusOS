"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/features/auth/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="lg" className="w-full" loading={pending}>
      {pending ? (
        "Signing out…"
      ) : (
        <>
          <LogOut className="size-4" /> Sign out
        </>
      )}
    </Button>
  );
}

export function SignOutForm() {
  return (
    <form action={logoutAction}>
      <Submit />
    </form>
  );
}
