import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { saveImageToStorage, saveInputImageToStorage } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    const len = req.headers.get('content-length');
    console.log(`[API] /api/library/save - Starting request. Content-Length: ${len}`);
    const session = await auth();

    if (!session?.user?.id) {
        console.error('[API] /api/library/save - Unauthorized');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        // Validation could be added here

        console.log(`[API] /api/library/save - Saving output for User: ${session.user.id}`);

        // 1. Save Output Image
        const outputUrl = await saveImageToStorage(body.outputImage);
        console.log(`[API] Output saved: ${outputUrl}`);

        // 2. Save Input Images
        const inputs = await Promise.all(
            (body.inputImages || []).map((img: string) => saveInputImageToStorage(img))
        );

        // 3. Persist to DB
        const creation = await prisma.creation.create({
            data: {
                userId: session.user.id,
                prompt: body.prompt,
                negative: body.negative,
                aspectRatio: body.aspectRatio,
                imageSize: body.imageSize,
                shotPreset: body.shotPreset,
                lightingPreset: body.lightingPreset,
                focalLength: body.focalLength,
                guidance: body.guidance,
                inputImageUrls: inputs,
                outputImageUrl: outputUrl,
                status: 'SUCCESS',
            },
        });

        console.log(`[API] DB Record created: ${creation.id}`);
        revalidatePath('/library');
        return NextResponse.json({ success: true, id: creation.id });
    } catch (error) {
        console.error('[API] /api/library/save - Failed:', error);
        return NextResponse.json({ error: 'Failed to save creation' }, { status: 500 });
    }
}
