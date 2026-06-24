import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    salt: "authjs.session-token",
  });
  const isLoggedIn = !!token;
  const role = (token?.role as string) ?? "";

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isPublicRoute = pathname === "/login" || pathname === "/portal/login" || pathname.startsWith("/api/") || pathname.startsWith("/_next/");

  if (isApiAuthRoute) return NextResponse.next();

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL(role === "CLIENT" ? "/portal/dashboard" : "/dashboard", nextUrl));
  }

  if (isLoggedIn && pathname === "/portal/login") {
    return NextResponse.redirect(new URL("/portal/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
