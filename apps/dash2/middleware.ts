import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const nonAuthRoutes = [ "/login", "/register", "/verify-email", "/reset-password", "/forgot-password" ];

export default async function middleware(request: NextRequest) {

  const isAuth = getSessionCookie(request)

  const isNonAuthRoute = nonAuthRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isNonAuthRoute && isAuth) {
    return NextResponse.redirect(new URL("/websites", request.url));
  }

  if (!isNonAuthRoute && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}


export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - public (public files like databuddy.js)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|databuddy.js).*)",
    ],
};
