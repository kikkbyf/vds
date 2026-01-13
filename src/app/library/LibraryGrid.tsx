'use client';

import { useStudioStore } from '@/store/useStudioStore';
import { useRouter } from 'next/navigation';
import CreationCard from '@/components/library/CreationCard';

// Define the full creation type needed for remixing
export interface FullCreation {
    id: string;
    userId: string;
    prompt: string;
    negative: string | null;
    aspectRatio: string;
    imageSize: string;
    shotPreset: string | null;
    lightingPreset: string | null;
    focalLength: number | null;
    guidance: number | null;
    inputImageUrls: string[];
    outputImageUrl: string;
    status: string;
    createdAt: Date;
}

interface LibraryGridProps {
    creations: FullCreation[];
}

export default function LibraryGrid({ creations }: LibraryGridProps) {
    const setParamsFromCreation = useStudioStore((state) => state.setParamsFromCreation);
    const router = useRouter();

    const handleRemix = (id: string) => {
        const creation = creations.find(c => c.id === id);
        if (!creation) return;

        // 1. Hydrate Store
        setParamsFromCreation({
            prompt: creation.prompt,
            negative: creation.negative,
            aspectRatio: creation.aspectRatio,
            imageSize: creation.imageSize,
            shotPreset: creation.shotPreset,
            lightingPreset: creation.lightingPreset,
            focalLength: creation.focalLength,
            guidance: creation.guidance,
            inputImageUrls: creation.inputImageUrls
        });

        // 2. Redirect to Studio
        router.push('/');
    };

    if (creations.length === 0) {
        return (
            <div className="empty-state">
                <h2>No creations yet</h2>
                <p>Start generating in the Studio to build your library.</p>

                <style jsx>{`
                    .empty-state {
                        height: 60vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: var(--text-secondary);
                        text-align: center;
                    }
                    h2 { font-size: 18px; margin-bottom: 8px; color: var(--text-primary); }
                    p { font-size: 14px; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="grid">
            {creations.map((creation) => (
                <CreationCard
                    key={creation.id}
                    item={creation}
                    onRemix={handleRemix}
                />
            ))}

            <style jsx>{`
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 20px;
                    padding: 24px;
                }
            `}</style>
        </div>
    );
}
