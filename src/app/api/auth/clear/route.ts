import { signOut } from "@/lib/auth";

export async function GET() {
  return signOut({ redirect: true, redirectTo: "/login" });
}
