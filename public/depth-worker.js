
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Skip local model checks, use remote HF models
env.allowLocalModels = false;
env.useBrowserCache = true;

class DepthEstimator {
    static instance = null;

    static async getInstance() {
        if (!this.instance) {
            console.log('📦 Loading Depth Model (Xenova/depth-anything-small-hf)...');
            this.instance = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
                device: 'webgpu' // Prefer WebGPU if available, fallback to WASM
            });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const { imageUrl } = event.data;

    try {
        console.log('🤖 Depth Worker: Starting inference...');
        const depthEstimator = await DepthEstimator.getInstance();

        // Run inference
        const result = await depthEstimator(imageUrl);

        console.log('✅ Depth Worker: Inference done.');

        // Convert the output to a blob/dataURL so we can send it back
        // We use OffscreenCanvas because we are in a Worker (no DOM access)
        const width = result.depth.width;
        const height = result.depth.height;
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const rawData = result.depth.data;
        const channels = rawData.length / (width * height);

        // Convert to RGBA (ImageData expects 4 channels)
        // If model returns 1 channel (grayscale), we need to replicate it
        const rgbaData = new Uint8ClampedArray(width * height * 4);

        for (let i = 0; i < width * height; i++) {
            // Get pixel value (assuming grayscale, take first channel)
            const val = rawData[i * channels];

            const idx = i * 4;
            rgbaData[idx] = val;     // R
            rgbaData[idx + 1] = val; // G
            rgbaData[idx + 2] = val; // B
            rgbaData[idx + 3] = 255; // Alpha (Opaque)
        }

        const imageData = new ImageData(rgbaData, width, height);
        ctx.putImageData(imageData, 0, 0);

        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const depthUrl = URL.createObjectURL(blob);

        self.postMessage({ status: 'complete', depthUrl });

    } catch (error) {
        console.error('❌ Depth Worker Error:', error);
        self.postMessage({ status: 'error', error: error.toString() });
    }
});
