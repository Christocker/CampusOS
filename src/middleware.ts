import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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

  // /login, /api/auth/*, /signout: allow through
  if (path === "/login" || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check for any auth cookie — if missing, redirect to /login
  const hasCookie = request.cookies.getAll().some((c) =>
    c.name.includes("authjs") || c.name.includes("next-auth")
  );
  if (!hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
