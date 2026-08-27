import type { NextAuthConfig } from "next-auth";

/** Shared auth configuration (safe to import from edge middleware — no DB imports). */
export const authConfig = {
  // trustHost is REQUIRED to work behind a reverse proxy / Cloudflare Tunnel.
  // Without it Auth.js rejects requests in production ("Missing host information")
  // and login/registration fail over the public internet.
  trustHost: true,
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "STUDENT" | "ADMIN") ?? "STUDENT";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
