import { create } from 'zustand';
import { generatePrompt } from '@/utils/promptUtils';
import { createCreation } from '@/actions/createCreation';

interface StudioState {
    // Input
    uploadedImages: string[];
    addUploadedImage: (url: string) => void;
    removeUploadedImage: (index: number) => void;

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
    credits: number;
    fetchCredits: () => Promise<void>;
    isGenerating: boolean;
    setIsGenerating: (val: boolean) => void;
    generatedImage: string | null;
    setGeneratedImage: (val: string | null) => void;
    currentPrompt: string;
    setPrompt: (val: string) => void;

    // Progress Tracking
    generationStatus: string;
    generationProgress: number; // 0-100
    setGenerationStatus: (status: string) => void;
    setGenerationProgress: (progress: number) => void;

    // Depth Map
    depthMapUrl: string | null;
    setDepthMapUrl: (url: string | null) => void;
    isExtractingDepth: boolean;
    setIsExtractingDepth: (val: boolean) => void;

    // View Mode
    viewMode: 'textured' | 'clay' | 'wireframe';
    setViewMode: (mode: 'textured' | 'clay' | 'wireframe') => void;

    getScreenshot: (() => string | null) | null;
    setGetScreenshot: (fn: () => string | null) => void;

    // Generation Settings
    aspectRatio: string;
    setAspectRatio: (val: string) => void;
    imageSize: string;
    setImageSize: (val: string) => void;
    guidanceScale: number;
    setGuidanceScale: (val: number) => void;
    negativePrompt: string;
    setNegativePrompt: (val: string) => void;
    enhancePrompt: boolean;
    setEnhancePrompt: (val: boolean) => void;

    generateImage: () => Promise<void>;

    // Remix / Restore
    setParamsFromCreation: (params: CreationParams) => void;
}

export interface CreationParams {
    prompt: string;
    negative: string | null;
    aspectRatio: string;
    imageSize: string;
    shotPreset: string | null;
    lightingPreset: string | null;
    focalLength: number | null;
    guidance: number | null;
    inputImageUrls: string[];
}

import { persist } from 'zustand/middleware';

export const useStudioStore = create<StudioState>()(
    persist(
        (set, get) => ({
            uploadedImages: [],
            depthMapUrl: null,

            credits: 0,
            fetchCredits: async () => {
                const { getUserCredits } = await import('@/actions/user');
                const c = await getUserCredits();
                set({ credits: c });
            },

            isGenerating: false,
            isExtractingDepth: false,

            // Progress Defaults
            generationStatus: 'Ready',
            generationProgress: 0,
            setGenerationStatus: (val) => set({ generationStatus: val }),
            setGenerationProgress: (val) => set({ generationProgress: val }),

            // Generation Defaults
            aspectRatio: '1:1',
            imageSize: '1K',
            guidanceScale: 60,
            negativePrompt: '',
            enhancePrompt: true,

            setAspectRatio: (val) => set({ aspectRatio: val }),
            setImageSize: (val) => set({ imageSize: val }),
            setGuidanceScale: (val) => set({ guidanceScale: val }),
            setNegativePrompt: (val) => set({ negativePrompt: val }),
            setEnhancePrompt: (val) => set({ enhancePrompt: val }),

            addUploadedImage: (url) => set((state) => ({
                uploadedImages: [...state.uploadedImages, url]
            })),
            removeUploadedImage: (index) => set((state) => ({
                uploadedImages: state.uploadedImages.filter((_, i) => i !== index)
            })),
            setDepthMapUrl: (url) => set({ depthMapUrl: url }),

            focalLength: 50,
            setFocalLength: (val) => set((state) => ({
                focalLength: val,
                currentPrompt: generatePrompt(state.shotPreset, val, state.lightingPreset)
            })),

            lightingPreset: 'rembrandt',
            setLightingPreset: (val) => set((state) => ({
                lightingPreset: val,
                currentPrompt: generatePrompt(state.shotPreset, state.focalLength, val)
            })),

            shotPreset: 'closeup',
            setShotPreset: (val) => set((state) => ({
                shotPreset: val,
                currentPrompt: generatePrompt(val, state.focalLength, state.lightingPreset)
            })),

            setIsGenerating: (val) => set({ isGenerating: val }),
            generatedImage: null,
            setGeneratedImage: (val) => set({ generatedImage: val }),

            currentPrompt: generatePrompt('closeup', 50, 'rembrandt'),
            setPrompt: (val) => set({ currentPrompt: val }),

            setIsExtractingDepth: (val) => set({ isExtractingDepth: val }),

            viewMode: 'textured',
            setViewMode: (mode) => set({ viewMode: mode }),

            getScreenshot: null,
            setGetScreenshot: (fn: () => string | null) => set({ getScreenshot: fn }),

            setParamsFromCreation: (params) => {
                set({
                    currentPrompt: params.prompt,
                    negativePrompt: params.negative || '',
                    aspectRatio: params.aspectRatio,
                    imageSize: params.imageSize,
                    uploadedImages: params.inputImageUrls,

                    // Optional overrides
                    ...(params.shotPreset && { shotPreset: params.shotPreset }),
                    ...(params.lightingPreset && { lightingPreset: params.lightingPreset }),
                    ...(params.focalLength && { focalLength: params.focalLength }),
                    ...(params.guidance && { guidanceScale: params.guidance }),
                });
            },

            generateImage: async () => {
                const {
                    uploadedImages, shotPreset, focalLength, lightingPreset, isGenerating,
                    currentPrompt, getScreenshot, aspectRatio, imageSize, guidanceScale,
                    negativePrompt, enhancePrompt
                } = get();
                if (isGenerating) return;

                set({ isGenerating: true, generatedImage: null, generationProgress: 5, generationStatus: 'Initializing...' });

                try {
                    // 1. Capture Viewport Screenshot
                    set({ generationStatus: 'Capturing Viewport...', generationProgress: 15 });
                    const viewportCapture = getScreenshot ? getScreenshot() : null;

                    // 2. Prepare image list
                    set({ generationStatus: 'Preparing Assets...', generationProgress: 30 });
                    const finalImages = [];
                    if (viewportCapture) {
                        finalImages.push(viewportCapture);
                    }
                    finalImages.push(...uploadedImages);

                    // Call Python API Server
                    set({ generationStatus: 'Sending to Gemini 3 Pro...', generationProgress: 50 });

                    // Start a slow synthetic progress animation while waiting
                    const progressInterval = setInterval(() => {
                        set((state) => {
                            if (state.generationProgress < 90) {
                                return { generationProgress: state.generationProgress + 1 };
                            }
                            return {};
                        });
                    }, 500);

                    const response = await fetch('/api/py/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prompt: currentPrompt,
                            images: finalImages,
                            shot_preset: shotPreset,
                            lighting_preset: lightingPreset,
                            focal_length: focalLength,
                            // New Parameters
                            aspect_ratio: aspectRatio,
                            image_size: imageSize,
                            guidance_scale: guidanceScale,
                            negative_prompt: negativePrompt,
                            enhance_prompt: enhancePrompt
                        }),
                    });

                    clearInterval(progressInterval);
                    set({ generationProgress: 95, generationStatus: 'Processing Response...' });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: response.statusText }));
                        throw new Error(errorData.error || errorData.detail || 'Generation failed');
                    }

                    const data = await response.json();
                    if (data.image_data) {
                        set({ generatedImage: data.image_data, generationProgress: 100, generationStatus: 'Complete' });

                        // Refresh credits immediately
                        get().fetchCredits();

                        // --- Auto-Save to Library ---
                        // We call the action directly
                        console.log("[Store] Triggering auto-save to library...");
                        createCreation({
                            prompt: currentPrompt,
                            aspectRatio: aspectRatio,
                            imageSize: imageSize,
                            shotPreset: shotPreset,
                            lightingPreset: lightingPreset,
                            focalLength: focalLength,
                            guidance: guidanceScale,
                            negative: negativePrompt,
                            inputImages: uploadedImages, // Pass inputs
                            outputImage: data.image_data // Pass output base64
                        })
                            .then(res => {
                                if (res.success) console.log("[Store] Auto-save success");
                                else console.error("[Store] Auto-save failed:", res.error);
                            })
                            .catch(err => console.error("[Store] Auto-save exception:", err));
                    } else {
                        throw new Error('API returned success but no image data found.');
                    }
                } catch (error) {
                    console.error("Generation failed:", error);
                    set({ generationStatus: 'Error: ' + (error as Error).message });
                } finally {
                    set({ isGenerating: false });
                    // Reset status after a delay
                    setTimeout(() => set({ generationStatus: 'Ready', generationProgress: 0 }), 3000);
                }
            }
        }),
        {
            name: 'fasion-photo-studio-storage',
            partialize: (state) => ({
                // Persist only these fields
                currentPrompt: state.currentPrompt,
                shotPreset: state.shotPreset,
                focalLength: state.focalLength,
                lightingPreset: state.lightingPreset,
                aspectRatio: state.aspectRatio,
                imageSize: state.imageSize,
                guidanceScale: state.guidanceScale,
                negativePrompt: state.negativePrompt,
                enhancePrompt: state.enhancePrompt,
                viewMode: state.viewMode
            }),
        }
    )
);
