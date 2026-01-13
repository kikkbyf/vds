import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function saveImageToStorage(base64Data: string): Promise<string> {
    // 1. Clean base64 string
    const base64Image = base64Data.split(';base64,').pop();
    if (!base64Image) {
        throw new Error('Invalid base64 data');
    }

    // 2. Generate unique filename
    const filename = `${uuidv4()}.png`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // 3. Write to disk (Railway Volume mounted at public/uploads)
    await fs.promises.writeFile(filepath, base64Image, { encoding: 'base64' });

    // 4. Return public URL
    return `/uploads/${filename}`;
}

export async function saveInputImageToStorage(urlOrBase64: string): Promise<string> {
    // If it's already a local path, return it
    if (urlOrBase64.startsWith('/uploads/')) return urlOrBase64;

    // If it's a base64
    if (urlOrBase64.startsWith('data:image')) {
        return saveImageToStorage(urlOrBase64);
    }

    // If it's an external URL (unlikely for upload, but possible if remixing), valid as is
    return urlOrBase64;
}
