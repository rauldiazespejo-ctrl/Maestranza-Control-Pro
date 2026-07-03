import { auth } from "@/auth-edge";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // Rutas públicas (siempre permitidas)
  const isPublic = ["/login", "/portal/login", "/api/auth", "/api/health"].some((p) =>
    nextUrl.pathname.startsWith(p)
  );

  if (isPublic) return NextResponse.next();

  // Si no está autenticado → login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protección de portal cliente
  const isPortal = nextUrl.pathname.startsWith("/portal");
  if (isPortal && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protección de dashboard admin/ops
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  if (isDashboard && role === "CLIENT") {
    return NextResponse.redirect(new URL("/portal/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/.*|api/health|api/auth).*)"],
};
