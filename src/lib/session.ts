import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: "STUDENT" | "ADMIN";
};

/**
 * Returns the logged-in user with fresh data from the DB.
 * Falls back to JWT data if the DB user was deleted (prevents redirect loops).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  if (!sessionUser?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  if (dbUser) {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      role: dbUser.role,
    };
  }

  // User was deleted from DB but JWT is still valid — return JWT data
  // so the page renders instead of causing a redirect loop.
  return {
    id: sessionUser.id,
    name: sessionUser.name ?? null,
    email: sessionUser.email ?? "",
    image: sessionUser.image ?? null,
    role: sessionUser.role ?? "STUDENT",
  };
}

/**
 * Returns the current user. If the session is invalid, redirects to /login.
 * If the user was deleted from DB, signs out via the client and redirects.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user!;
}
