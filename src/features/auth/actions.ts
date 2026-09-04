"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema, codeLoginSchema } from "./validations";
import type { ActionState } from "@/features/shared/validations";
import { AuthError } from "next-auth";

export type { ActionState };

/**
 * Only allow same-origin relative redirect targets.
 * Blocks open-redirect via ?callbackUrl=https://evil.example.
 */
function safeRedirect(raw: FormDataEntryValue | null): string {
  const url = typeof raw === "string" && raw.length > 0 ? raw : "/";
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }

  return { ok: true };
}

export async function loginWithCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = codeLoginSchema.safeParse({
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.code?.[0] ?? "Enter your access code.",
    };
  }

  try {
    await signIn("credentials", {
      code: parsed.data.code,
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid or expired code." };
    }
    throw err;
  }

  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
