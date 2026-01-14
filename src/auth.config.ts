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
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.approved = user.approved;
                token.sub = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token?.sub) {
                session.user.id = token.sub;
                session.user.role = token.role as string;
                session.user.approved = token.approved as boolean;
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts to avoid edge runtime issues with bcrypt
} satisfies NextAuthConfig;
