"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/features/shared/validations";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out.slice(0, 5);
}

export async function createInviteCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    return { error: "Only an admin can create access codes." };
  }

  const label = String(formData.get("label") ?? "").trim() || null;
  const code = generateCode();

  await prisma.inviteCode.create({
    data: { code, label, role: "STUDENT", createdById: user.id },
  });

  return { ok: true, code };
}
