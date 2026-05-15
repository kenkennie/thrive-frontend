// src/middleware.ts
// When a logged-in user lands on / (dashboard), check their permissions.
// If they lack 'dashboard:view', redirect to the first page they CAN access.

import { NextRequest, NextResponse } from "next/server";

const ROUTE_PERMISSION_MAP = [
  { path: "/appointments", permission: "appointments:view" },
  { path: "/clients", permission: "clients:view" },
  { path: "/invoices", permission: "invoices:view" },
  { path: "/clinical/sessions", permission: "sessions:view" },
  { path: "/reports", permission: "reports:view" },
  { path: "/staff", permission: "staff:view" },
  { path: "/settings", permission: "settings:view" },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept the dashboard root
  if (pathname !== "/") return NextResponse.next();

  const token =
    request.cookies.get("accessToken")?.value ??
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  // Read permissions from the JWT payload (no DB call in edge)
  // The auth store saves a compact permissions array in the token claim
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    const perms: string[] = decoded.permissions ?? [];

    const hasDashboard = perms.includes("dashboard:view");
    if (hasDashboard) return NextResponse.next();

    // Find first permitted route
    const first = ROUTE_PERMISSION_MAP.find((r) =>
      perms.includes(r.permission),
    );
    if (first) return NextResponse.redirect(new URL(first.path, request.url));

    // No permissions at all — show a "no access" page
    return NextResponse.redirect(new URL("/no-access", request.url));
  } catch {
    // Token unreadable — let the client-side auth handle it
    return NextResponse.next();
  }
}

export const config = { matcher: ["/"] };
