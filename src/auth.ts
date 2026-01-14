import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

// Define the auth options separately if needed, but NextAuth v5 style uses simple config
export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        email: z.string().optional(),
                        password: z.string().optional()
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    // DEVELOPMENT BYPASS
                    // Only allowed in development environment
                    const isDev = process.env.NODE_ENV === 'development';

                    // If no email/password provided (or specific bypass defaults), and we are local
                    if (isDev && (!email || !password || (email === 'admin@example.com' && password === 'bypass'))) {
                        console.log('⚡️ Using Dev Bypass Login');
                        return {
                            id: 'dev-admin',
                            email: 'admin@example.com',
                            role: 'admin',
                            approved: true,
                        };
                    }

                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user) return null;

                    if (!user.approved) {
                        console.log(`Login attempt by unapproved user: ${email}`);
                        throw new Error('PendingApproval');
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    callbacks: {
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
                // Ensure we validate status against DB for critical checks on every session refresh
                // This forces a DB read on every session check (e.g. page load), which is safer for immediate bans
                let dbUser = null;

                // Skip DB check for dev bypass user
                if (token.sub === 'dev-admin') {
                    dbUser = { role: 'admin', approved: true };
                } else {
                    try {
                        dbUser = await prisma.user.findUnique({
                            where: { id: token.sub },
                            select: { role: true, approved: true }
                        });
                    } catch (err) {
                        console.error('Session DB check failed:', err);
                        // If DB fails, maybe allow session keeps alive or destroy? 
                        // For safety, proceed only if we have a token.
                        // But if this is a real user and DB is down, we might want to return valid session to avoid logout loops if possible,
                        // OR return null. 
                    }
                }

                if ((!dbUser || !dbUser.approved) && token.sub !== 'dev-admin') {
                    // Invalid/Unapproved user - destroy session effectively
                    // NextAuth doesn't have a clean "invalidate" return type here easily 
                    // allowing null user often triggers signout on client
                    return { ...session, user: null as any };
                }

                session.user.id = token.sub;
                session.user.role = dbUser?.role || 'user'; // Use fresh DB role
                session.user.approved = dbUser?.approved || false;
            }
            return session;
        },
    },
    secret: process.env.AUTH_SECRET || 'dev-secret-fallback-key',
});
