import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  const isPublic = ["/login", "/portal/login", "/api/auth", "/api/health"].some((path) =>
    nextUrl.pathname.startsWith(path)
  );

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

  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  if (isDashboard && role === "CLIENT") {
    return NextResponse.redirect(new URL("/portal/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/.*|api/health|api/auth).*)"],
};
