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

        // Code-based login: user enters just the code (unlimited use)
        if (raw.code && typeof raw.code === "string") {
          const code = raw.code.trim();

          const inviteCode = await prisma.inviteCode.findUnique({
            where: { code },
          });
          if (!inviteCode) return null;

          const name = inviteCode.label || "Student";
          const ts = Date.now().toString(36);
          const email = `${name.toLowerCase().replace(/\s+/g, ".")}.${ts}@campusos.local`;
          const user = await prisma.user.create({
            data: { name, email, passwordHash: "", role: inviteCode.role },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
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
