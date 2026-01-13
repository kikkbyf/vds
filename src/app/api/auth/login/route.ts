import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { password } = body;

    if (password === process.env.ACCESS_PASSWORD) {
        const response = NextResponse.json({ success: true });
        // Set cookie logic
        response.cookies.set('vds_access_token', password, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
