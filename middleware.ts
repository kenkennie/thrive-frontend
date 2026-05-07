import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/resend-verification",
  "/verify-token",
  "/2fa/generate",
  "/2fa/enable",
  "/2fa",
  "/invite",
  "/confirm-email-change",
];

const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-subrequest");
  // Auth token stored in localStorage (client-side only) —
  // we use a cookie set at login for SSR-side protection.
  const token = request.cookies.get("thrive:session")?.value;
  const isAuthenticated = !!token;

  // Check if current route is public

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute && pathname !== "/") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Pass modified headers if needed
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
