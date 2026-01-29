import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generatePrompt } from '@/utils/promptUtils';

export interface TaskItem {
    id: string;
    type: string; // 'generation', 'persona', 'extraction', etc.
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    progress: number;
    message: string;
    startTime: number;
    prompt: string; // Metadata for UI
    name?: string; // Optional task name for UI display
    thumbnail?: string; // Optional result thumbnail
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

    // Async Task Queue
    activeTasks: TaskItem[];
    addActiveTask: (task: TaskItem) => void;
    removeActiveTask: (taskId: string) => void;
    updateTaskStatus: (taskId: string, status: string, progress: number, message: string, result?: any) => void;
    cancelTask: (taskId: string) => Promise<void>;

    submitGenericTask: (endpoint: string, payload: any, taskType?: string, promptStr?: string) => Promise<string>;

    generateImage: () => Promise<void>;

    // Remix / Restore
    setParamsFromCreation: (params: CreationParams) => void;
}

export const useStudioStore = create<StudioState>()(
    persist(
        (set, get) => ({
            uploadedImages: [],
            depthMapUrl: null,

            credits: 0,
            fetchCredits: async () => {
                try {
                    const res = await fetch('/api/user/credits');
                    if (res.ok) {
                        const data = await res.json();
                        set({ credits: data.credits });
                    }
                } catch (e) {
                    console.error("Failed to fetch credits:", e);
                }
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
                    uploadedImages: params.inputImageUrls || [],

                    ...(params.shotPreset && { shotPreset: params.shotPreset }),
                    ...(params.lightingPreset && { lightingPreset: params.lightingPreset }),
                    ...(params.focalLength && { focalLength: params.focalLength }),
                    ...(params.guidance && { guidanceScale: params.guidance }),
                });
            },

            // --- Async Task Queue Implementation ---
            activeTasks: [],

            addActiveTask: (task) => set((state) => ({
                activeTasks: [task, ...state.activeTasks],
                isGenerating: true
            })),

            removeActiveTask: (taskId) => set((state) => {
                const newTasks = state.activeTasks.filter(t => t.id !== taskId);
                return {
                    activeTasks: newTasks,
                    isGenerating: newTasks.length > 0
                };
            }),

            updateTaskStatus: (taskId, status, progress, message, result) => set((state) => ({
                activeTasks: state.activeTasks.map(t =>
                    t.id === taskId
                        ? { ...t, status: status as any, progress, message, thumbnail: result?.image_data ? result.image_data : t.thumbnail }
                        : t
                )
            })),

            cancelTask: async (taskId) => {
                try {
                    await fetch(`/api/py/tasks/${taskId}/cancel`, { method: 'POST' });
                    get().updateTaskStatus(taskId, 'CANCELLED', 0, 'Cancelled by user');
                } catch (e) {
                    console.error("Failed to cancel task", e);
                }
            },

            submitGenericTask: async (endpoint: string, payload: any, taskType?: string, promptStr?: string) => {
                const { addActiveTask, setGenerationStatus } = get();

                try {
                    setGenerationStatus('Submitting Task...');
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail || 'Submission failed');
                    }

                    const data = await response.json();

                    addActiveTask({
                        id: data.task_id,
                        type: taskType || 'generic',
                        status: 'PENDING',
                        progress: 0,
                        message: 'Queued',
                        startTime: Date.now(),
                        prompt: promptStr || 'Async Task',
                        name: promptStr || 'Async Task' // 用于 UI 显示和任务识别
                    });

                    setGenerationStatus('Task Queued');
                    startTaskPoller(get, set);
                    return data.task_id;

                } catch (error) {
                    console.error("Generic Task Submission failed:", error);
                    setGenerationStatus('Error: ' + (error as Error).message);
                    throw error;
                }
            },

            generateImage: async () => {
                const {
                    uploadedImages, shotPreset, focalLength, lightingPreset, isGenerating,
                    currentPrompt, getScreenshot, aspectRatio, imageSize, guidanceScale,
                    negativePrompt, enhancePrompt, addActiveTask, setGenerationStatus
                } = get();

                // Prevent duplicate submission only if we want strict blocking, 
                // but since we support queue, maybe allow multiple? 
                // Let's stick to simple "one at a time" button spam prevention for now 
                // OR allow multiple. User said "Queue". 
                // If isGenerating is true, maybe we just warn? 
                // Let's allow multiple submissions! Remove the check or make it smarter.
                // CURRENTLY: isGenerating is connected to "Loading" UI. 
                // If we want multiple, we should decoupling "loading button" from "generating state".
                // For now, let's keep isGenerating as "at least one task is active".

                // 1. Capture Viewport
                setGenerationStatus('Capturing Viewport...');
                const viewportCapture = getScreenshot ? getScreenshot() : null;

                // 2. Prepare Inputs
                const finalImages = [];
                if (viewportCapture) finalImages.push(viewportCapture);
                finalImages.push(...uploadedImages);

                // 3. Submit
                setGenerationStatus('Submitting Task...');
                try {
                    const response = await fetch('/api/py/tasks/submit/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: currentPrompt,
                            images: finalImages,
                            shot_preset: shotPreset,
                            lighting_preset: lightingPreset,
                            focal_length: focalLength,
                            aspect_ratio: aspectRatio,
                            image_size: imageSize,
                            guidance_scale: guidanceScale,
                            negative_prompt: negativePrompt,
                            enhance_prompt: enhancePrompt
                        }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail || 'Submission failed');
                    }

                    const data = await response.json();

                    addActiveTask({
                        id: data.task_id,
                        type: 'generation',
                        status: 'PENDING',
                        progress: 0,
                        message: 'Queued',
                        startTime: Date.now(),
                        prompt: currentPrompt
                    });

                    setGenerationStatus('Task Queued');
                    startTaskPoller(get, set);

                } catch (error) {
                    console.error("Submission failed:", error);
                    setGenerationStatus('Error: ' + (error as Error).message);
                    // If queue is empty, reset generating flag
                    if (get().activeTasks.length === 0) {
                        set({ isGenerating: false });
                    }
                }
            }
        }),
        {
            name: 'fasion-photo-studio-storage',
            partialize: (state) => ({
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
                // NOTE: activeTasks NOT persisted - contains large base64 thumbnails that overflow localStorage
            }),
        }
    )
);

// --- Polling Logic ---
let pollerInterval: NodeJS.Timeout | null = null;

const startTaskPoller = (get: () => StudioState, set: any) => {
    if (pollerInterval) return;

    console.log("Starting Task Poller...");
    pollerInterval = setInterval(async () => {
        const { activeTasks, updateTaskStatus, removeActiveTask, setGeneratedImage, fetchCredits, setGenerationStatus, setGenerationProgress } = get();

        if (activeTasks.length === 0) {
            if (pollerInterval) {
                clearInterval(pollerInterval);
                pollerInterval = null;
            }
            console.log("No active tasks, stopping poller.");
            return;
        }

        for (const task of activeTasks) {
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.status)) {
                continue;
            }

            try {
                const res = await fetch(`/api/py/tasks/${task.id}`);
                if (res.status === 404) {
                    updateTaskStatus(task.id, 'FAILED', 0, 'Task not found');
                    continue;
                }

                const data = await res.json();

                if (JSON.stringify(data.status) !== JSON.stringify(task.status) ||
                    data.progress !== task.progress ||
                    data.message !== task.message) {

                    updateTaskStatus(task.id, data.status, data.progress, data.message, data.result);

                    // Sync main UI
                    if (task === activeTasks[0]) {
                        setGenerationStatus(data.message);
                        setGenerationProgress(data.progress);
                    }
                }

                if (data.status === 'COMPLETED') {
                    if (data.result && data.result.image_data) {
                        setGeneratedImage(data.result.image_data);
                        fetchCredits();
                        setGenerationStatus('Ready'); // Reset main UI status
                        setGenerationProgress(100);
                    }
                }
            } catch (e) {
                console.warn(`Polling failed for task ${task.id}`, e);
            }
        }
    }, 2000);
};
