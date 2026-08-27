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

/** Redirects to /login if not authenticated or session is stale. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
