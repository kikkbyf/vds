import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), '_generation_logs');

export async function getLocalCreations() {
    if (process.env.NODE_ENV !== 'development') return [];
    if (!fs.existsSync(LOGS_DIR)) return [];

    const sessions = await fs.promises.readdir(LOGS_DIR);
    const creations: any[] = [];

    // Reverse to show newest first
    for (const session of sessions.reverse()) {
        const sessionPath = path.join(LOGS_DIR, session);
        const stat = await fs.promises.stat(sessionPath);
        if (!stat.isDirectory()) continue;

        const sessionCreations: any[] = [];
        let hasExtraction = false;

        // Inside a session, there are transaction folders
        const transactions = await fs.promises.readdir(sessionPath);
        for (const tx of transactions) {
            const txPath = path.join(sessionPath, tx);
            const txStat = await fs.promises.stat(txPath);
            if (!txStat.isDirectory()) continue;

            const promptPath = path.join(txPath, 'prompt.json');
            const outputPath = path.join(txPath, 'output.png');

            if (fs.existsSync(promptPath) && fs.existsSync(outputPath)) {
                try {
                    const promptData = JSON.parse(await fs.promises.readFile(promptPath, 'utf-8'));

                    // Use relative path to avoid absolute path encoding issues
                    // Format: session_id/transaction_id/output.png
                    const relativePath = `${session}/${tx}/output.png`;
                    const localUrl = `/api/local-image?key=${encodeURIComponent(relativePath)}`;

                    const promptText = promptData.prompt || 'No prompt';
                    let creationType = 'standard';

                    // Check for markers identifying specific technical extractions
                    if (promptText.includes('Horizontal Character Sheet') || promptText.includes('2x2 Grid Image')) {
                        creationType = 'extraction';
                        hasExtraction = true;
                    }

                    sessionCreations.push({
                        id: tx,
                        sessionId: session, // Add session ID logic
                        creationType: creationType,
                        createdAt: txStat.ctime,
                        prompt: promptText,
                        outputImageUrl: localUrl,
                        status: 'COMPLETED',
                        width: 1024, // Assumed
                        height: 1024,
                        user: {
                            name: 'Local Dev',
                            email: 'dev@local',
                            image: null
                        }
                    });
                } catch (e) {
                    console.error(`Failed to parse local log: ${txPath}`, e);
                }
            }
        }

        // Second pass: if this session contains an extraction, mark the source images as 'digital_human'
        if (hasExtraction) {
            sessionCreations.forEach(c => {
                if (c.creationType === 'standard') {
                    c.creationType = 'digital_human';
                }
            });
        }

        creations.push(...sessionCreations);
    }

    // Sort by creation time desc
    return creations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
