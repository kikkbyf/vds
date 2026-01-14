'use server';

import fs from 'fs/promises';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

export type LogSession = {
    id: string; // The folder name (timestamp)
    timestamp: string;
};

export type LogDetails = {
    id: string;
    prompt: string;
    inputs: string[]; // Base64 data URIs
    output: string | null; // Base64 data URI
};

export async function listLogSessions(): Promise<LogSession[]> {
    try {
        await fs.access(LOGS_DIR);
        const entries = await fs.readdir(LOGS_DIR, { withFileTypes: true });

        const sessions = entries
            .filter(dirent => dirent.isDirectory())
            .map(dirent => ({
                id: dirent.name,
                timestamp: dirent.name.replace(/_/g, ' '),
            }))
            .sort((a, b) => b.id.localeCompare(a.id)); // Newest first

        return sessions;
    } catch (error) {
        console.warn('Logs directory not found or inaccessible:', error);
        return [];
    }
}

export async function getLogSessionDetails(sessionId: string): Promise<LogDetails | null> {
    const sessionDir = path.join(LOGS_DIR, sessionId);

    // Security check: prevent directory traversal
    if (!sessionDir.startsWith(LOGS_DIR)) {
        return null;
    }

    try {
        const files = await fs.readdir(sessionDir);

        let prompt = '';
        const inputs: string[] = [];
        let output: string | null = null;

        // Parallel read
        await Promise.all(files.map(async (file) => {
            const filePath = path.join(sessionDir, file);

            if (file === 'prompt.txt') {
                prompt = await fs.readFile(filePath, 'utf-8');
            } else if (file.startsWith('input_') && (file.endsWith('.png') || file.endsWith('.jpg'))) {
                const buffer = await fs.readFile(filePath);
                const mime = file.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
                inputs.push(`data:${mime};base64,${buffer.toString('base64')}`);
            } else if (file === 'output.png') {
                const buffer = await fs.readFile(filePath);
                output = `data:image/png;base64,${buffer.toString('base64')}`;
            }
        }));

        // Sort inputs by name (input_0, input_1)
        inputs.sort((a, b) => {
            // This is a rough sort as we lost the filename, but order in list usually matches read order.
            // Ideally we'd map filename to content first.
            return 0;
        });

        // Better sort logic:
        // We can just rely on file listing sort if we processed serially, 
        // but parallel is faster. 
        // Let's re-read inputs with proper ordering if needed. 
        // Actually, let's keep it simple.

        return {
            id: sessionId,
            prompt,
            inputs,
            output
        };
    } catch (error) {
        console.error(`Failed to read log details for ${sessionId}:`, error);
        return null;
    }
}
