import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PREVIEW_COOKIE, isValidPreviewToken } from "@/lib/previewAuth";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAuth";

const PUBLIC_PREVIEW_PATHS = new Set(["/quizzes/preview-login"]);

function withNoIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pre-existing /admin gate — kept separate from the preview gate below so the Content
  // Manager isn't weaker OR stronger than every other /admin/* route.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Private preview gate for the not-yet-public quiz library and its API.
  if (PUBLIC_PREVIEW_PATHS.has(pathname)) {
    return withNoIndex(NextResponse.next());
  }

  const authed = isValidPreviewToken(request.cookies.get(PREVIEW_COOKIE)?.value);

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
