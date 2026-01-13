'use client';

import { RefreshCw, Clock } from 'lucide-react';
import Image from 'next/image';

// Lightweight type definition to avoid importing heavy Prisma types on client if not needed
// consistent with what getLibrary returns
interface CreationItem {
    id: string;
    prompt: string;
    outputImageUrl: string;
    createdAt: Date;
    // ... we can add more fields if we show them
}

interface CreationCardProps {
    item: CreationItem;
    onRemix: (id: string) => void;
}

export default function CreationCard({ item, onRemix }: CreationCardProps) {
    return (
        <div className="creation-card group">
            <div className="image-wrapper">
                {/* Use unoptimized logic for local uploads if needed, or standard Next Image */}
                <Image
                    src={item.outputImageUrl}
                    alt={item.prompt}
                    fill
                    className="creation-image"
                    unoptimized={item.outputImageUrl.startsWith('/uploads')}
                />

                {/* Overlay */}
                <div className="overlay">
                    <button
                        className="remix-btn"
                        onClick={() => onRemix(item.id)}
                        title="Remix this creation"
                    >
                        <RefreshCw size={16} />
                        <span>Remix</span>
                    </button>
                </div>
            </div>

            <div className="info">
                <p className="prompt-text">{item.prompt}</p>
                <div className="meta">
                    <Clock size={12} />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <style jsx>{`
                .creation-card {
                    background: var(--bg-panel);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .creation-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    transform: translateY(-2px);
                }

                .image-wrapper {
                    position: relative;
                    aspect-ratio: 1;
                    background: #000;
                    overflow: hidden;
                }
                .creation-image {
                    object-fit: cover;
                    transition: transform 0.3s;
                }
                .group:hover .creation-image {
                    transform: scale(1.05);
                }

                .overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .group:hover .overlay {
                    opacity: 1;
                }

                .remix-btn {
                    background: var(--accent-blue);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transform: translateY(10px);
                    transition: transform 0.2s;
                }
                .group:hover .remix-btn {
                    transform: translateY(0);
                }
                .remix-btn:hover {
                    background: var(--accent-blue-hover, #2b6cb0);
                }

                .info {
                    padding: 12px;
                    border-top: 1px solid var(--border-color);
                }
                .prompt-text {
                    font-size: 13px;
                    color: var(--text-primary);
                    margin: 0 0 8px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.4;
                }
                .meta {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}
