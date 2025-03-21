import { NextRequest, NextResponse } from 'next/server'

// This middleware ensures the app is initialized properly
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Configure matcher for routes that need the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 