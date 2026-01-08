import { create } from 'zustand';

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

export const useStudioStore = create<StudioState>((set) => ({
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

    generateImage: async () => {
        set({ isGenerating: true, generatedImage: null });
        // Mock Delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Mock Result
        set({
            isGenerating: false,
            generatedImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        });
    }
}));
