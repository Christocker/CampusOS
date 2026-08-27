"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "./validations";
import { AuthError } from "next-auth";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
  code?: string;
};

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
      redirectTo: (formData.get("callbackUrl") as string) || "/",
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
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return { error: "Enter your access code." };
  }

  try {
    await signIn("credentials", {
      code,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid or already-used code." };
    }
    throw err;
  }

  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
