"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type ProfileState = {
  error?: string;
  ok?: boolean;
};

export async function updateEmailAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  if (!user) return { error: "Session expired. Please sign in again." };
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== user.id) {
    return { error: "This email is already in use." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { email },
  });

  revalidatePath("/profile");
  return { ok: true };
}
