import type { NextAuthConfig } from "next-auth";

/**
 * Base Auth.js configuration (no DB imports — Node-only consumers
 * add DB-backed callbacks on top of this).
 */
export const authConfig = {
  // trustHost is REQUIRED to work behind a reverse proxy / Cloudflare Tunnel.
  // Without it Auth.js rejects requests in production ("Missing host information")
  // and login/registration fail over the public internet.
  // NOTE: AUTH_URL must be set to the canonical https:// URL when running
  // behind a tunnel so poisoned Host headers cannot alter auth redirects.
  trustHost: true,
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user && "id" in user) {
        token.id = user.id as string;
        token.role = (user as { role?: "STUDENT" | "ADMIN" }).role;
      }
      return token;
    },
  },
} satisfies NextAuthConfig;
