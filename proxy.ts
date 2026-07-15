import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  const isPublic =
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/portal/login" ||
    nextUrl.pathname.startsWith("/api/auth/") ||
    nextUrl.pathname === "/api/health";

  if (isPublic) return NextResponse.next();

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isPortal = nextUrl.pathname.startsWith("/portal");
  if (isPortal && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  const isInternalArea = !isPortal && !nextUrl.pathname.startsWith("/api/");
  if (isInternalArea && role === "CLIENT") {
    return NextResponse.redirect(new URL("/portal/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/.*|api/health|api/auth).*)"],
};
