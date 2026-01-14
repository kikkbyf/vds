'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});

export async function registerUser(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const result = RegisterSchema.safeParse(data);

    if (!result.success) {
        return { error: 'Invalid data' };
    }

    const { email, password, name } = result.data;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { error: 'User already exists' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
                role: 'USER', // Default role
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Registration failed:', error);
        return { error: 'Failed to create user' };
    }
}
