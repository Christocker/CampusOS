import { cache } from "react";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: "STUDENT" | "ADMIN";
};

/**
 * Returns the logged-in user, or null.
 * Session data is already DB-fresh (see the DB-backed session callback in
 * lib/auth.ts). Wrapped in React cache() so AppShell + page + layout calls
 * within one request share a single lookup.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const sessionUser = session?.user as
    | { id?: string; name?: string | null; email?: string | null; image?: string | null; role?: "STUDENT" | "ADMIN" }
    | undefined;
  if (!sessionUser?.id) return null;

  return {
    id: sessionUser.id,
    name: sessionUser.name ?? null,
    email: sessionUser.email ?? "",
    image: sessionUser.image ?? null,
    role: sessionUser.role ?? "STUDENT",
  };
});

/**
 * Returns the current user or null when no valid session exists.
 * NOTE: does not redirect — callers MUST handle null (pages render
 * <SessionExpired />, actions return an error ActionState).
 */
export async function requireUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}
