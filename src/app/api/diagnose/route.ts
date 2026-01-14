import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cwd = process.cwd();
        const uploadDir = path.join(cwd, 'public', 'uploads');
        const exists = fs.existsSync(uploadDir);

        let files: string[] = [];
        let statsInfo: { name: string; size: number; mtime: Date }[] = [];

        if (exists) {
            files = fs.readdirSync(uploadDir);
            // Get stats for last 5 files
            statsInfo = files.slice(-5).map(f => {
                const s = fs.statSync(path.join(uploadDir, f));
                return { name: f, size: s.size, mtime: s.mtime };
            });
        }

        return NextResponse.json({
            status: 'Diagnostic Report',
            cwd,
            uploadDir,
            uploadDirExists: exists,
            totalFiles: files.length,
            recentFiles: statsInfo,
            env: process.env.NODE_ENV,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
