import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 600; // Increased to 600s (10min) for 4K/Retry generation

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const pathString = path.join('/');
    const backendUrl = `http://127.0.0.1:8000/${pathString}`;

    // --- BILLING LOGIC START ---
    let cost = 0;
    let userId = null;
    let shouldBill = false;
    const transactionId = uuidv4(); // Generate Trace ID

    // Only bill for generation endpoint
    if (pathString.includes('generate')) {
        shouldBill = true;
    }

    // 2. Get body (we need it for both billing and forwarding)
    let bodyText = '';
    try {
        bodyText = await req.text();
    } catch (e) {
        return NextResponse.json({ error: 'Failed to read body' }, { status: 400 });
    }

    if (shouldBill) {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        userId = session.user.id;

        // --- DEV BYPASS ---
        if (userId === 'dev-admin') {
            console.log(`[Billing] [${transactionId}] Skipping billing check for dev-admin`);
            shouldBill = false; // Disable billing for this request
        } else {
            // Parse to find cost
            try {
                const jsonBody = JSON.parse(bodyText);
                const size = jsonBody.image_size || '1K';

                // "4k=5积分 1k=1积分 2k=2积分"
                if (String(size).toUpperCase().includes('4K')) cost = 5;
                else if (String(size).toUpperCase().includes('2K')) cost = 2;
                else cost = 1; // Default 1K or other

                // Check Balance
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user || (user.credits ?? 0) < cost) {
                    return NextResponse.json(
                        { error: `Insufficient Credits. Cost: ${cost}, Balance: ${user?.credits ?? 0}` },
                        { status: 402 }
                    );
                }

                // Deduct (Optimistic)
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: userId },
                        data: { credits: { decrement: cost } }
                    }),
                    prisma.creditLog.create({
                        data: {
                            userId: userId,
                            amount: -cost,
                            reason: `Generation ${size} [TxID: ${transactionId}]`
                        }
                    })
                ]);
                console.log(`[Billing] [${transactionId}] Deducted ${cost} credits from ${userId} for ${size}`);

            } catch (error) {
                console.error(`[Billing] [${transactionId}] Error processing billing:`, error);
                return NextResponse.json({ error: 'Billing check failed' }, { status: 500 });
            }
        } // End else (real billing)
    }
    // --- BILLING LOGIC END ---

    // Imports needed (ensure these are at top of file, but tool might need help merging imports if not present)
    // Suggestion: I will add the imports via a separate block or rely on existing imports + add new ones if possible.
    // Actually, I should use multi_replace for imports + logic. But since I can update imports here too if I replace enough context or just add them.
    // Let's assume standard imports are:
    // import { NextRequest, NextResponse } from 'next/server';
    // import { auth } from '@/auth';
    // import prisma from '@/lib/prisma';
    // import { v4 as uuidv4 } from 'uuid';
    // import { saveImageToStorage, saveInputImageToStorage } from '@/lib/storage'; // Custom
    // import { revalidatePath } from 'next/cache';

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 600 seconds (10 mins)

        const secret = process.env.INTERNAL_API_SECRET || "";
        if (!secret) {
            console.error(`[Proxy] [${transactionId}] INTERNAL_API_SECRET is missing!`);
        }

        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Secret': secret,
                'X-Transaction-ID': transactionId
            },
            body: bodyText,
            cache: 'no-store',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!backendResponse.ok) {
            // --- REFUND ON FAILURE ---
            if (shouldBill && userId && cost > 0) {
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: userId },
                        data: { credits: { increment: cost } }
                    }),
                    prisma.creditLog.create({
                        data: {
                            userId: userId,
                            amount: cost,
                            reason: `Refund: Backend Failure (${backendResponse.status}) [TxID: ${transactionId}]`
                        }
                    })
                ]);
                console.log(`[Billing] [${transactionId}] Refunded ${cost} credits to ${userId} due to backend failure.`);
            }
            // -------------------------

            const errorText = await backendResponse.text();
            console.error(`[Proxy] [${transactionId}] Backend Error (${backendResponse.status}):`, errorText);
            return NextResponse.json(
                { error: `Backend failed: ${backendResponse.statusText}`, details: errorText },
                { status: backendResponse.status }
            );
        }

        const data = await backendResponse.json();

        // --- SERVER-SIDE AUTO-SAVE ---
        // If this was a generation request, user is logged in, and we have image data
        if (shouldBill && userId && data.image_data) {
            try {
                // Dynamically import storage to avoid top-level issues if any
                const { saveImageToStorage, saveInputImageToStorage } = await import('@/lib/storage');
                const { revalidatePath } = await import('next/cache');

                console.log(`[Auto-Save] [${transactionId}] Starting server-side save for User: ${userId}`);

                // 1. Parse original body for metadata
                const reqJson = JSON.parse(bodyText);

                // 2. Save Output
                const outputUrl = await saveImageToStorage(data.image_data);

                // 3. Save Inputs (if any)
                // The body has 'images' array which are base64 or urls
                const inputImages = reqJson.images || [];
                const savedInputUrls = await Promise.all(
                    inputImages.map((img: string) => saveInputImageToStorage(img))
                );

                // 4. Create DB Record
                // Logic: Check for recent session (within 5 minutes) to group
                const SESSION_WINDOW_MS = 5 * 60 * 1000;
                const now = new Date();

                const recentCreation = await prisma.creation.findFirst({
                    where: {
                        userId: userId,
                        createdAt: { gt: new Date(now.getTime() - SESSION_WINDOW_MS) },
                        sessionId: { not: null }
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { sessionId: true }
                });

                let sessionId = recentCreation?.sessionId || require('uuid').v4(); // Reuse or New

                // Infer Type
                const finalPrompt = reqJson.prompt || data.compiled_prompt || '';
                let creationType = 'standard';
                const p = finalPrompt.toLowerCase();

                if (p.includes('horizontal character sheet') || p.includes('2x2 grid image') || p.includes('character reference sheet')) {
                    creationType = 'extraction';
                } else if (p.includes('digital human') || p.includes('best quality')) {
                    // Refine heuristics as needed
                    creationType = 'digital_human';
                }

                // If this is an extraction, we should ensure the session is marked appropriately
                // But since we can't update previous items easily here without extra query, we rely on the grouping logic.
                // However, if we reuse a session, we are good.

                // Detect Local SQLite Mode
                const isSQLite = process.env.DATABASE_URL?.startsWith('file:');

                const creation = await prisma.creation.create({
                    data: {
                        userId: userId,
                        prompt: finalPrompt,
                        negative: reqJson.negative_prompt || '',
                        aspectRatio: reqJson.aspect_ratio || '1:1',
                        imageSize: reqJson.image_size || '1K',
                        shotPreset: reqJson.shot_preset || null,
                        lightingPreset: reqJson.lighting_preset || null,
                        focalLength: reqJson.focal_length ? Number(reqJson.focal_length) : null,
                        guidance: reqJson.guidance_scale ? Number(reqJson.guidance_scale) : null,
                        // [LOCAL-DEV-FIX] Auto-serialize array for SQLite, keep array for Postgres
                        inputImageUrls: isSQLite ? JSON.stringify(savedInputUrls) : (savedInputUrls as any),
                        outputImageUrl: outputUrl,
                        status: 'SUCCESS',
                        sessionId: sessionId,
                        creationType: creationType
                    },
                });

                console.log(`[Auto-Save] [${transactionId}] DB Record created: ${creation.id}`);

                // 5. Revalidate Library
                revalidatePath('/library');

                // Attach creation ID to response (optional, but helpful)
                data.creationId = creation.id;

            } catch (saveError) {
                console.error(`[Auto-Save] [${transactionId}] FAILED to save creation:`, saveError);
                // Do NOT fail the request, just log it. The user still gets the image.
            }
        }
        // -----------------------------

        return NextResponse.json(data);

    } catch (error) {
        // --- REFUND ON NETWORK ERROR ---
        if (shouldBill && userId && cost > 0) {
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: userId },
                    data: { credits: { increment: cost } }
                }),
                prisma.creditLog.create({
                    data: {
                        userId: userId,
                        amount: cost,
                        reason: `Refund: Network Error [TxID: ${transactionId}]`
                    }
                })
            ]);
            console.log(`[Billing] [${transactionId}] Refunded ${cost} credits to ${userId} due to network error.`);
        }
        // -------------------------

        console.error(`[Proxy] [${transactionId}] Connection Failed:`, error);
        return NextResponse.json(
            { error: 'Proxy connection failed', details: (error as Error).message },
            { status: 502 }
        );
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const pathString = path.join('/');
    const backendUrl = `http://127.0.0.1:8000/${pathString}`;

    // Inject Secret even for GET requests if they exist/are protected
    const secret = process.env.INTERNAL_API_SECRET || "";

    try {
        const backendResponse = await fetch(backendUrl, {
            cache: 'no-store',
            headers: { 'X-Internal-Secret': secret }
        });
        const data = await backendResponse.json();

        // --- ASYNC TASK AUTO-SAVE ---
        // Check if this is a Task Response with COMPLETED status and Image Data
        if (data.status === 'COMPLETED' && data.result && data.result.image_data) {
            try {
                // Check if we should save (User must be logged in)
                const session = await auth();
                const userId = session?.user?.id;

                if (userId) {
                    console.log(`[Auto-Save-Async] Task ${data.id} completed. Saving...`);

                    // Imports
                    const { saveImageToStorage, saveInputImageToStorage } = await import('@/lib/storage');
                    const { revalidatePath } = await import('next/cache');

                    // 0. Check for existing record to prevent Double Save
                    const existing = await prisma.creation.findFirst({
                        where: { sessionId: data.id },
                        select: { id: true }
                    });

                    if (existing) {
                        // Already saved
                        // console.log(`[Auto-Save-Async] Task ${data.id} already saved as ${existing.id}`);
                    } else {
                        // 1. Save Result Image
                        const outputUrl = await saveImageToStorage(data.result.image_data);

                        // 2. Metadata Extraction
                        const metadata = data.metadata || {};
                        // Handle Persona vs Standard
                        const isPersona = !!metadata.persona;

                        // Prompt Logic
                        let finalPrompt = '';
                        if (isPersona) {
                            // For persona, we might want the name or description
                            finalPrompt = `Digital Persona: ${metadata.persona.name || 'Unnamed'}`;
                            // Or use compiled prompt if available in result?? 
                            // Result structure from worker: { image_data: "...", compiled_prompt: "..." }
                            if (data.result.compiled_prompt) finalPrompt += `\n\nPrompt: ${data.result.compiled_prompt}`;
                        } else {
                            finalPrompt = metadata.prompt || '';
                        }

                        // Params
                        const negative = metadata.negative_prompt || '';
                        const aspectRatio = metadata.aspect_ratio || '1:1';
                        const imageSize = metadata.image_size || '1K';

                        // Creation Type Heuristics
                        let creationType = 'standard';
                        if (isPersona) creationType = 'digital_human';
                        else if (finalPrompt.toLowerCase().includes('grid') || finalPrompt.toLowerCase().includes('sheet')) creationType = 'extraction';

                        // 3. Save Inputs (if any present in metadata)
                        const inputImages = metadata.images || (metadata.image_url ? [metadata.image_url] : []);
                        const savedInputUrls = await Promise.all(
                            (inputImages || []).map((img: string) => saveInputImageToStorage(img))
                        );

                        // 4. Create DB Record
                        // Use Task ID as Session ID or create new?
                        // Task ID is unique enough. 
                        const isSQLite = process.env.DATABASE_URL?.startsWith('file:');

                        const creation = await prisma.creation.create({
                            data: {
                                userId: userId,
                                prompt: finalPrompt,
                                negative: negative,
                                aspectRatio: aspectRatio,
                                imageSize: imageSize,

                                shotPreset: metadata.shot_preset || null,
                                lightingPreset: metadata.lighting_preset || null,
                                focalLength: metadata.focal_length ? Number(metadata.focal_length) : null,
                                guidance: metadata.guidance_scale ? Number(metadata.guidance_scale) : null,

                                inputImageUrls: isSQLite ? JSON.stringify(savedInputUrls) : (savedInputUrls as any),
                                outputImageUrl: outputUrl,

                                status: 'SUCCESS',
                                // Use Task ID as session correlation
                                sessionId: data.id,
                                creationType: creationType
                            }
                        });

                        console.log(`[Auto-Save-Async] Saved Creation ${creation.id}`);
                        revalidatePath('/library');
                    }
                }
            } catch (saveErr) {
                // Duplicate key error? means already saved.
                if ((saveErr as any).code === 'P2002') {
                    // Unique constraint failed, likely already saved. Ignore.
                    // But Creation ID is random CUID, so uniqueness is on... what?
                    // We don't enforce unique sessionId. So we might double save.
                    // To prevent double save, we should ideally check `sessionId: data.id` first.
                } else {
                    console.error("[Auto-Save-Async] Error:", saveErr);
                }
            }
        }
        // -----------------------------

        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
    }
}
