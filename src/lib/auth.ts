import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(72),
});

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, "Invalid code");

// Constant-time defense against user enumeration: when no user/hash is
// found we still run a bcrypt comparison against this dummy hash.
let dummyHashPromise: Promise<string> | null = null;
async function timingSafeDummyCompare(password: string): Promise<void> {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash("campusos-timing-safe-dummy", 12);
  }
  await bcrypt.compare(password, await dummyHashPromise);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Re-read the user from the DB on every auth() call so deleted or
    // demoted users cannot keep acting on a stale JWT.
    async session({ session, token }) {
      if (!session.user) return session;
      const id =
        (token.id as string | undefined) ?? (token.sub as string | undefined);
      if (!id) {
        session.user.id = "";
        return session;
      }
      const dbUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, image: true, role: true },
      });
      if (!dbUser) {
        // User was deleted — invalidate identity so consumers treat this
        // session as signed out.
        session.user.id = "";
        return session;
      }
      session.user.id = dbUser.id;
      session.user.name = dbUser.name;
      session.user.email = dbUser.email;
      session.user.image = dbUser.image;
      session.user.role = dbUser.role;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (raw) => {
        if (!raw) return null;

        // Code-based login: find user associated with this code
        if (raw.code && typeof raw.code === "string") {
          const parsedCode = codeSchema.safeParse(raw.code);
          if (!parsedCode.success) return null;
          const code = parsedCode.data.toUpperCase();

          const inviteCode = await prisma.inviteCode.findUnique({
            where: { code },
            include: { user: true },
          });
          if (!inviteCode || !inviteCode.user) return null;

          // Enforce expiration when set.
          if (inviteCode.expiresAt && inviteCode.expiresAt <= new Date()) {
            return null;
          }

          const u = inviteCode.user;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image ?? undefined,
            role: u.role,
          };
        }

        // Email + password login (admin)
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) {
          await timingSafeDummyCompare(password);
          return null;
        }
        if (!user.passwordHash) {
          // Accounts created via invite codes have no password.
          await timingSafeDummyCompare(password);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
});
