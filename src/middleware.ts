import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // Handle /signout: clear all cookies and redirect to /login
  if (path === "/signout") {
    const response = NextResponse.redirect(new URL("/login", nextUrl));
    const cookieNames = ["authjs.session-token", "__Secure-authjs.session-token",
      "authjs.callback-url", "__Secure-authjs.callback-url",
      "authjs.csrf-token", "__Secure-authjs.csrf-token"];
    for (const name of cookieNames) {
      response.cookies.delete(name);
    }
    // Also delete any cookie starting with authjs
    for (const cookie of req.cookies.getAll()) {
      if (cookie.name.includes("authjs")) {
        response.cookies.delete(cookie.name);
      }
    }
    return response;
  }

  const isLoggedIn = !!req.auth;
  const isAuthPage = path === "/login";
  const isApiAuth = path.startsWith("/api/auth");

  if (isApiAuth) return;

  if (isAuthPage) {
    if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
    return;
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
