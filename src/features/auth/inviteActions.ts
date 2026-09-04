"use server";

import { randomInt, randomBytes } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/features/shared/validations";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no I/O/0/1
const CODE_LENGTH = 5;

const labelSchema = z
  .string()
  .trim()
  .min(1, "Label is required (e.g. the student's name).")
  .max(60, "Label must be 60 characters or fewer.");

/** Unbiased code generation using crypto.randomInt. */
function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

/** Keep the local-part to characters that are safe inside an email address. */
function sanitizeEmailLocalPart(label: string): string {
  const cleaned = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  return cleaned || "student";
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

  const parsedLabel = labelSchema.safeParse(formData.get("label"));
  if (!parsedLabel.success) {
    return { error: parsedLabel.error.flatten().formErrors[0] };
  }
  const label = parsedLabel.data;

  const parsedRole = z.enum(["STUDENT", "ADMIN"]).safeParse(formData.get("role"));
  const role = parsedRole.success ? parsedRole.data : "STUDENT";

  try {
    // Create user + code atomically; retry on (very rare) code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      // Fresh collision-safe email suffix per attempt (timestamp + random hex).
      const email = `${sanitizeEmailLocalPart(label)}.${Date.now().toString(36)}.${randomBytes(3).toString("hex")}@campusos.local`;
      try {
        const created = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: label,
              email,
              passwordHash: "", // code-only account; guarded at login
              role,
            },
          });
          const invite = await tx.inviteCode.create({
            data: {
              code,
              label,
              role,
              createdById: admin.id,
              userId: newUser.id,
            },
          });
          return invite;
        });
        return { ok: true, code: created.code };
      } catch (err) {
        const isCodeConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("code");
        const isEmailConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("email");
        if (isCodeConflict) continue; // regenerate and retry
        if (isEmailConflict) {
          return { error: "Could not generate a unique account email. Try again." };
        }
        throw err;
      }
    }
    return { error: "Could not generate a unique code. Please try again." };
  } catch (err) {
    console.error("[Invite] create failed:", err);
    return { error: "Failed to create access code." };
  }
}
