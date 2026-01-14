import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;

            // Allow access to login page
            if (nextUrl.pathname.startsWith('/login')) return true;

            // Allow access to registration API (if any public ones exist)
            // But generally, protect everything else including root '/'

            if (isLoggedIn) return true;

            // Redirect unauthenticated users to login page
            return false;
        },
    },
    providers: [], // Configured in auth.ts to avoid edge runtime issues with bcrypt
} satisfies NextAuthConfig;
