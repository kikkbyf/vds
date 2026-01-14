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
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
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
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true, approved: true }
                });

                if (!dbUser || !dbUser.approved) {
                    // Invalid/Unapproved user - destroy session effectively
                    // NextAuth doesn't have a clean "invalidate" return type here easily 
                    // allowing null user often triggers signout on client
                    return { ...session, user: null as any };
                }

                session.user.id = token.sub;
                session.user.role = dbUser.role; // Use fresh DB role
                session.user.approved = dbUser.approved;
            }
            return session;
        },
    },
});
