import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Set max duration to 60 seconds (for Vercel/Next.js limits)

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    // 1. Parse path
    const { path } = await params;
    const pathString = path.join('/');
    const backendUrl = `http://127.0.0.1:8000/${pathString}`;

    console.log(`[Proxy] Forwarding POST to: ${backendUrl}`);

    try {
        // 2. Get body
        const bodyText = await req.text();

        // 3. Forward request
        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: bodyText,
            cache: 'no-store',
            // @ts-ignore - Node.js fetch extension for timeout signals if needed, 
            // but standard fetch waits. Next.js might verify timeout via export const maxDuration.
        });

        // 4. Handle errors from backend
        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error(`[Proxy] Backend Error (${backendResponse.status}):`, errorText);
            return NextResponse.json(
                { error: `Backend failed: ${backendResponse.statusText}`, details: errorText },
                { status: backendResponse.status }
            );
        }

        // 5. Return success
        const data = await backendResponse.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('[Proxy] Connection Failed:', error);
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

    try {
        const backendResponse = await fetch(backendUrl, { cache: 'no-store' });
        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
    }
}
