import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);

  for (const cookie of allCookies) {
    response.cookies.set(cookie.name, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}
