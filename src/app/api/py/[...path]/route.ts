import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 180; // Changed from 60 to 180 as per requirement

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

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds - Strict Requirement

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
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
    }
}
