import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PREVIEW_COOKIE, isValidPreviewToken } from "@/lib/previewAuth";

const ADMIN_SESSION_COOKIE = "admin_session";
const PUBLIC_PREVIEW_PATHS = new Set(["/quizzes/preview-login"]);

function withNoIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function adminSessionValid(request: NextRequest): boolean {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  const expected = secret && Buffer.from(secret).toString("base64");
  return !!session && !!expected && session === expected;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pre-existing /admin gate (unchanged behavior) — kept separate from the new preview gate
  // below so the Content Manager isn't weaker OR stronger than every other /admin/* route.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!adminSessionValid(request)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // New: private preview gate for the not-yet-public quiz library and its API.
  if (PUBLIC_PREVIEW_PATHS.has(pathname)) {
    return withNoIndex(NextResponse.next());
  }

  const token = request.cookies.get(PREVIEW_COOKIE)?.value;
  const authed = isValidPreviewToken(token);

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return withNoIndex(NextResponse.json({ error: "Not authorized" }, { status: 401 }));
    }
    const loginUrl = new URL("/quizzes/preview-login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withNoIndex(NextResponse.redirect(loginUrl));
  }

  return withNoIndex(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/quizzes/:path*", "/api/quiz-guess/:path*", "/api/content/:path*"],
};
