import { removeBackground as imglyRemoveBackground, Config } from '@imgly/background-removal';

/**
 * Removes background using a robust local AI model (WebAssembly).
 */
export async function removeBackground(file: File): Promise<string> {
    try {
        const config: Config = {
            progress: (key, current, total) => {
                console.log(`Downloading ${key}: ${current} of ${total}`);
            },
            debug: false,
            model: 'small', // Use small model for speed
            output: {
                format: 'image/png',
                quality: 0.8
            }
        };

        const blob = await imglyRemoveBackground(file, config);
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('AI Extraction Failed:', error);
        // Fallback to raw file if AI fails
        return URL.createObjectURL(file);
    }
}
