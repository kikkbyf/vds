import { create } from 'zustand';
import { generatePrompt } from '@/utils/promptUtils';

interface StudioState {
    // Input
    imageUrl: string | null;
    setImageUrl: (url: string) => void;

    // Camera / Lens
    focalLength: number; // e.g. 35, 50, 85
    setFocalLength: (val: number) => void;

    // Lighting
    lightingPreset: string;
    setLightingPreset: (val: string) => void;

    // Shot Type
    shotPreset: string;
    setShotPreset: (val: string) => void;

    // Generation
    isGenerating: boolean;
    setIsGenerating: (val: boolean) => void;
    generatedImage: string | null;
    setGeneratedImage: (val: string | null) => void;

    // Depth Map
    depthMapUrl: string | null;
    setDepthMapUrl: (url: string | null) => void;
    isExtractingDepth: boolean;
    setIsExtractingDepth: (val: boolean) => void;

    // View Mode
    viewMode: 'textured' | 'clay' | 'wireframe';
    setViewMode: (mode: 'textured' | 'clay' | 'wireframe') => void;

    generateImage: () => Promise<void>;
}

export const useStudioStore = create<StudioState>((set, get) => ({
    imageUrl: null, // Default to null so we see the Wireframe Head initially
    depthMapUrl: null,
    isGenerating: false,
    isExtractingDepth: false,

    setImageUrl: (url) => set({ imageUrl: url }),
    setDepthMapUrl: (url) => set({ depthMapUrl: url }),

    focalLength: 50,
    setFocalLength: (val) => set({ focalLength: val }),

    lightingPreset: 'rembrandt',
    setLightingPreset: (val) => set({ lightingPreset: val }),

    shotPreset: 'closeup',
    setShotPreset: (val) => set({ shotPreset: val }),

    setIsGenerating: (val) => set({ isGenerating: val }),
    generatedImage: null,
    setGeneratedImage: (val) => set({ generatedImage: val }),

    setIsExtractingDepth: (val) => set({ isExtractingDepth: val }),

    viewMode: 'textured',
    setViewMode: (mode) => set({ viewMode: mode }),

    getScreenshot: null,
    setGetScreenshot: (fn) => set({ getScreenshot: fn }),

    generateImage: async () => {
        const { imageUrl, shotPreset, focalLength, lightingPreset, isGenerating } = get();
        if (isGenerating) return;

        set({ isGenerating: true, generatedImage: null });

        try {
            const prompt = generatePrompt(shotPreset, focalLength, lightingPreset);

            // Call Python API Server
            const response = await fetch('http://127.0.0.1:8000/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    image_url: imageUrl,
                    shot_preset: shotPreset,
                    lighting_preset: lightingPreset,
                    focal_length: focalLength
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || 'Generation failed');
            }

            const data = await response.json();
            if (data.image_data) {
                set({ generatedImage: data.image_data });
            }
        } catch (error) {
            console.error("Generation failed:", error);
            // Optional: set some error state here
        } finally {
            set({ isGenerating: false });
        }
    }
}));
