import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const validPaths = ['/library', '/api/upload']; // Protected Users
            const isProtected = validPaths.some(path => nextUrl.pathname.startsWith(path));

            if (isProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        session({ session, token }) {
            if (session.user && token?.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts to avoid edge runtime issues with bcrypt
} satisfies NextAuthConfig;
