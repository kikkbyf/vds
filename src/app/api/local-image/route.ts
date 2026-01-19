import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return new NextResponse('Not found', { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get('key'); // Relative path: session/tx/file.png

    if (!key) {
        return new NextResponse('Key required', { status: 400 });
    }

    // Security check: Ensure we are reading from _generation_logs
    const projectRoot = process.cwd();
    const logsDir = path.join(projectRoot, '_generation_logs');

    // Resolve full path safely to prevent directory traversal
    const absolutePath = path.resolve(logsDir, key);

    console.log(`[LocalImage] Key: ${key}`);
    console.log(`[LocalImage] Abs: ${absolutePath}`);

    if (!absolutePath.startsWith(logsDir)) {
        console.error(`[LocalImage] Forbidden Access: ${absolutePath}`);
        return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
        console.error(`[LocalImage] Not Found: ${absolutePath}`);
        return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(absolutePath);
    const contentType = mime.getType(absolutePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
