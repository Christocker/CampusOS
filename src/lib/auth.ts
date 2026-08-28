import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Code", type: "text" },
        name: { label: "Name", type: "text" },
      },
      authorize: async (raw) => {
        if (!raw) return null;

        // Code-based login: find user associated with this code
        if (raw.code && typeof raw.code === "string") {
          const code = raw.code.trim();

          const inviteCode = await prisma.inviteCode.findUnique({
            where: { code },
            include: { user: true },
          });
          if (!inviteCode || !inviteCode.user) return null;

          const u = inviteCode.user;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
          };
        }

        // Email + password login (admin)
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

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
