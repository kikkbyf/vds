'use server';

import fs from 'fs';
import path from 'path';

export async function checkStorageDebug() {
    try {
        const cwd = process.cwd();
        const uploadDir = path.join(cwd, 'public', 'uploads');

        const exists = fs.existsSync(uploadDir);
        let files: string[] = [];
        let stats = null;

        if (exists) {
            files = fs.readdirSync(uploadDir);
            stats = fs.statSync(uploadDir);
        }

        return {
            cwd,
            uploadDir,
            exists,
            fileCount: files.length,
            files: files.slice(0, 10), // Show first 10
            canWrite: exists ? 'Assume yes if exists' : 'No',
        };
    } catch (error: any) {
        return {
            error: error.message,
            stack: error.stack
        };
    }
}
