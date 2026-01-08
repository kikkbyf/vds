
import { pipeline, env } from '@xenova/transformers';

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
        // result is typically { depth: Tensor, predicted_depth: Tensor }

        // The output from pipeline('depth-estimation') usually includes a .depth property 
        // which is a raw Tensor, or sometimes a helper object depending on version.
        // For 'depth-anything', it might return a grayscale image object or tensor.
        // Let's assume it returns an object we can convert.

        // Actually, Transformers.js image pipelines often return a Jimp-like object or raw data.
        // Let's look at the standard output. For depth-estimation it returns { depth: Image }
        // We can get the data URL from that image object if strictly supported, 
        // OR we might need to manually construct the canvas.

        // Safe bet: The result.depth is a RawImage object in newer versions.
        // We can convert RawImage to Blob.

        console.log('✅ Depth Worker: Inference done.');

        // Convert the output to a blob/dataURL so we can send it back
        // If result.depth is a raw image wrapper provided by transformers.js:
        const canvas = document.createElement('canvas');
        canvas.width = result.depth.width;
        canvas.height = result.depth.height;
        const ctx = canvas.getContext('2d');

        // Create ImageData
        const imageData = new ImageData(
            Uint8ClampedArray.from(result.depth.data),
            result.depth.width,
            result.depth.height
        );
        ctx.putImageData(imageData, 0, 0);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const depthUrl = URL.createObjectURL(blob);

        self.postMessage({ status: 'complete', depthUrl });

    } catch (error) {
        console.error('❌ Depth Worker Error:', error);
        self.postMessage({ status: 'error', error: error.toString() });
    }
});
