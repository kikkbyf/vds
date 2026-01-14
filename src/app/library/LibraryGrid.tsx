// Imports updated
import { useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { useRouter } from 'next/navigation';
import CreationCard from '@/components/library/CreationCard';
import CreationDetailsModal from '@/components/library/CreationDetailsModal';

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
    const [selectedId, setSelectedId] = useState<string | null>(null);

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

    const selectedCreation = creations.find(c => c.id === selectedId);

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
        <div className="masonry-container">
            {creations.map((creation) => (
                <div key={creation.id} className="masonry-item">
                    <CreationCard
                        item={creation}
                        onRemix={handleRemix}
                        onClick={() => setSelectedId(creation.id)}
                    />
                </div>
            ))}

            {selectedCreation && (
                <CreationDetailsModal
                    creation={selectedCreation}
                    onClose={() => setSelectedId(null)}
                    onRemix={handleRemix}
                />
            )}

            <style jsx>{`
                .masonry-container {
                    padding: 24px;
                    column-count: 4;
                    column-gap: 20px;
                }
                .masonry-item {
                    break-inside: avoid;
                    margin-bottom: 20px;
                }
                
                @media (max-width: 1400px) {
                    .masonry-container { column-count: 3; }
                }
                @media (max-width: 1000px) {
                    .masonry-container { column-count: 2; }
                }
                @media (max-width: 600px) {
                    .masonry-container { column-count: 1; }
                }
            `}</style>
        </div>
    );
}
