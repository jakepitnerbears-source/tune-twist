import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

const PROTECTED_ROUTES = [
  "/admin",
  "/archive",
  "/schedule",
  "/library",
  "/songs",
  "/jukebox",
  "/classic",
  "/how-to-play",
  "/media",
  "/preview",
];

function isProtected(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();
  if (!isProtected(pathname)) return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const expected =
    process.env.ADMIN_SESSION_SECRET &&
    Buffer.from(process.env.ADMIN_SESSION_SECRET).toString("base64");

  if (!session || !expected || session !== expected) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/archive/:path*",
    "/schedule/:path*",
    "/library/:path*",
    "/songs/:path*",
    "/jukebox/:path*",
    "/classic/:path*",
    "/how-to-play/:path*",
    "/media/:path*",
    "/preview/:path*",
    "/archive",
    "/schedule",
    "/library",
    "/songs",
    "/jukebox",
    "/classic",
    "/how-to-play",
    "/media",
    "/preview",
  ],
};
