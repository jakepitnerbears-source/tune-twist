import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const isLogin = req.nextUrl.pathname === "/admin/login";
  const session = req.cookies.get("admin_session");
  if (!isLogin && !session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };
