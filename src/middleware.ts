import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // If no password is set, allow access
    if (!process.env.ACCESS_PASSWORD) {
        return NextResponse.next();
    }

    // Allow access to public assets
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.includes('.') // naive static file check
    ) {
        return NextResponse.next();
    }

    // Check for specialized cookie
    const authCookie = request.cookies.get('vds_access_token');

    if (authCookie?.value === process.env.ACCESS_PASSWORD) {
        return NextResponse.next();
    }

    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
