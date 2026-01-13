'use client';

import React, { useMemo, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '@/store/useStudioStore';

function ParticleSystem({ imageUrl }: { imageUrl: string }) {
    const pointsRef = useRef<THREE.Points>(null);

    // Use loader to get the image data
    const texture = useLoader(THREE.TextureLoader, imageUrl);

    const geometryData = useMemo(() => {
        if (!texture.image) return null;

        const img = texture.image;
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;

        const MAX_POINTS = 400000;
        let step = 1;
        if (width * height > MAX_POINTS) {
            step = Math.ceil(Math.sqrt((width * height) / MAX_POINTS));
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, width, height).data;

        const positions: number[] = [];
        const colors: number[] = [];
        const worldScale = 5 / height;

        for (let y = 0; y < height; y += step) {
            let minX = width;
            let maxX = 0;
            let hasPixels = false;

            for (let x = 0; x < width; x += step) {
                const i = (y * width + x) * 4;
                const alpha = data[i + 3];
                if (alpha > 40) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    hasPixels = true;
                }
            }

            if (!hasPixels) continue;

            const centerX = (minX + maxX) / 2;
            const radius = (maxX - minX) / 2;

            for (let x = minX; x <= maxX; x += step) {
                const i = (y * width + x) * 4;
                const alpha = data[i + 3];

                if (alpha > 40) {
                    const r = data[i] / 255;
                    const g = data[i + 1] / 255;
                    const b = data[i + 2] / 255;

                    const normX = radius > 0 ? (x - centerX) / radius : 0;
                    const safeNormX = Math.max(-1, Math.min(1, normX));
                    const depthFactor = Math.sqrt(1 - safeNormX * safeNormX);

                    const px = (x - width / 2) * worldScale;
                    const py = (height - y - height / 2) * worldScale;
                    const pz = depthFactor * (radius * worldScale) * 0.6;

                    positions.push(px, py, pz);
                    colors.push(r, g, b);
                }
            }
        }

        return {
            positions: new Float32Array(positions),
            colors: new Float32Array(colors)
        };
    }, [texture]);

    if (!geometryData) return null;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={geometryData.positions.length / 3}
                    array={geometryData.positions}
                    itemSize={3}
                    args={[geometryData.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={geometryData.colors.length / 3}
                    array={geometryData.colors}
                    itemSize={3}
                    args={[geometryData.colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.02}
                vertexColors
                transparent
                opacity={0.85}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

export default function ParticleHologram() {
    const imageUrl = useStudioStore((state) => state.imageUrl);
    if (!imageUrl) return null;

    return (
        <React.Suspense fallback={null}>
            <ParticleSystem key={imageUrl} imageUrl={imageUrl} />
        </React.Suspense>
    );
}
