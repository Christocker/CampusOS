import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";

const SESSION_COOKIES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

/**
 * Cryptographically verifies the Auth.js JWT session cookie.
 * Presence alone is NOT trusted — a forged cookie must fail decode().
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  for (const name of SESSION_COOKIES) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;
    try {
      const decoded = await decode({ secret, salt: name, token });
      if (!decoded || !(decoded.id || decoded.sub)) continue;
      // jose validates exp during decrypt, but be explicit: reject expired.
      if (typeof decoded.exp === "number" && decoded.exp * 1000 <= Date.now()) {
        continue;
      }
      return true;
    } catch {
      // invalid/forged/expired token — try next candidate
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // /signout: delete ALL cookies and redirect to /login
  if (path === "/signout") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    for (const cookie of request.cookies.getAll()) {
      response.cookies.delete(cookie.name);
    }
    return response;
  }

  // /login and /api/auth/* need no session; everything else is protected below.
  if (path === "/login" || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Verify the session JWT — if missing or invalid, redirect to /login
  if (!(await hasValidSession(request))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
