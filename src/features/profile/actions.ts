"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type ProfileState = {
  error?: string;
  ok?: boolean;
};

// Normalized exactly like the login flow (see lib/auth.ts), otherwise a
// mixed-case email saved here could never be used to sign in.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export async function updateEmailAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };

  const parsed = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "Enter a valid email address." };
  }
  const email = parsed.data;

  if (email === user.email.toLowerCase()) {
    return { ok: true }; // nothing changed — skip the write
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== user.id) {
    return { error: "This email is already in use." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { email },
    });
  } catch (err) {
    console.error("[Profile] email update failed:", err);
    return { error: "Failed to update email. Please try again." };
  }

  revalidatePath("/profile");
  return { ok: true };
}
