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
  const admin = await requireUser();
  if (!admin) return { error: "Session expired." };
  if (admin.role !== "ADMIN") {
    return { error: "Only an admin can create access codes." };
  }

  const label = String(formData.get("label") ?? "").trim();
  if (!label) {
    return { error: "Label is required (e.g. the student's name)." };
  }

  const code = generateCode();
  const ts = Date.now().toString(36);
  const email = `${label.toLowerCase().replace(/\s+/g, ".")}.${ts}@campusos.local`;

  const newUser = await prisma.user.create({
    data: {
      name: label,
      email,
      passwordHash: "",
      role: "STUDENT",
    },
  });

  await prisma.inviteCode.create({
    data: {
      code,
      label,
      role: "STUDENT",
      createdById: admin.id,
      userId: newUser.id,
    },
  });

  return { ok: true, code };
}
