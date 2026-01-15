'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { saveImageToStorage, saveInputImageToStorage } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

export type CreateCreationInput = {
    prompt: string;
    aspectRatio: string;
    imageSize: string;
    // ... other params
    shotPreset?: string;
    lightingPreset?: string;
    focalLength?: number;
    guidance?: number;
    negative?: string;
    inputImages: string[]; // Base64 or URLs
    outputImage: string;   // Base64
};

export async function createCreation(data: CreateCreationInput) {
    console.log(`[CreationAction] Starting for prompt: ${data.prompt.substring(0, 50)}...`);
    const session = await auth();

    if (!session?.user?.id) {
        console.error(`[CreationAction] Unauthorized: No session found`);
        throw new Error('Unauthorized');
    }

    try {
        console.log(`[CreationAction] User: ${session.user.id}, Saving output image...`);
        // 1. Save Output Image
        const outputUrl = await saveImageToStorage(data.outputImage);
        console.log(`[CreationAction] Output saved to: ${outputUrl}`);

        // 2. Save Input Images (if they are new base64 uploads)
        console.log(`[CreationAction] Saving ${data.inputImages.length} input images...`);
        const inputs = await Promise.all(
            data.inputImages.map((img) => saveInputImageToStorage(img))
        );

        // 3. Persist to DB
        const creation = await prisma.creation.create({
            data: {
                userId: session.user.id,
                prompt: data.prompt,
                negative: data.negative,
                aspectRatio: data.aspectRatio,
                imageSize: data.imageSize,
                shotPreset: data.shotPreset,
                lightingPreset: data.lightingPreset,
                focalLength: data.focalLength,
                guidance: data.guidance,
                inputImageUrls: inputs,
                outputImageUrl: outputUrl,
                status: 'SUCCESS',
            },
        });

        console.log(`[CreationAction] DB Record created: ${creation.id}`);
        revalidatePath('/library');
        return { success: true };
    } catch (error) {
        console.error('[CreationAction] Failed to create creation:', error);
        return { success: false, error: 'Failed to save creation' };
    }
}
