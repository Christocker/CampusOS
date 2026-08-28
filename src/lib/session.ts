import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: "STUDENT" | "ADMIN";
};

/** Returns the logged-in user with fresh data from the DB, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  if (!sessionUser?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image,
    role: dbUser.role,
  };
}

/**
 * Returns the current user or signs out stale sessions and redirects to /login.
 * This prevents infinite redirect loops where the JWT is valid but the user
 * was deleted from the DB.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    await signOut({ redirectTo: "/login" });
  }
  return user!;
}
