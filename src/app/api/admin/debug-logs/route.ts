import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const LOG_ROOT = path.join(process.cwd(), '_generation_logs');

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    // GET DETAILS
    if (sessionId) {
        try {
            // Log session dirs are "YYYY-MM-DD_HH-mm-ss"
            // We need to find which folder contains this ID, or if ID is the folder itself?
            // Wait, previous implementation listed global sessions (Timestamp folders) or TxIDs?
            // "listLogSessions" returned folders. "getLogSessionDetails" took an ID.
            // Let's assume ID passed here is the Timestamp Folder Name (which is the session ID in this context)

            const sessionPath = path.join(LOG_ROOT, sessionId);
            if (!fs.existsSync(sessionPath)) {
                return NextResponse.json({ error: 'Session not found' }, { status: 404 });
            }

            // Read session.json
            const jsonPath = path.join(sessionPath, 'session.json');
            let data: any = {};
            if (fs.existsSync(jsonPath)) {
                data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            }

            // Find images
            const files = fs.readdirSync(sessionPath);
            const inputImages = files.filter(f => f.startsWith('input_')).map(f => `/api/admin/logs/image?session=${sessionId}&file=${f}`);
            const outputImage = files.find(f => f.startsWith('output_')) ? `/api/admin/logs/image?session=${sessionId}&file=${files.find(f => f.startsWith('output_'))!}` : null;

            return NextResponse.json({
                id: sessionId,
                timestamp: sessionId,
                prompt: data.prompt || 'No Prompt Recorded',
                inputs: inputImages,
                output: outputImage
            });

        } catch (e) {
            console.error(e);
            return NextResponse.json({ error: 'Failed to read details' }, { status: 500 });
        }
    }

    // LIST SESSIONS
    try {
        if (!fs.existsSync(LOG_ROOT)) {
            return NextResponse.json([]);
        }
        const dirs = fs.readdirSync(LOG_ROOT).filter(f => fs.statSync(path.join(LOG_ROOT, f)).isDirectory());
        // Sort descending
        dirs.sort().reverse();

        const sessions = dirs.map(d => ({
            id: d,
            timestamp: d
        }));

        return NextResponse.json(sessions);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to list logs' }, { status: 500 });
    }
}
