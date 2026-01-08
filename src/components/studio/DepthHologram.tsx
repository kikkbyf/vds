'use client';

import React, { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '@/store/useStudioStore';

// Fallback Component for Flat Image (No Depth)
function FlatHologram({ imageUrl }: { imageUrl: string }) {
    const colorMap = useLoader(THREE.TextureLoader, imageUrl);
    const { width, height } = colorMap.image;
    const aspect = width / height;

    const baseSize = 3;
    const planeWidth = aspect >= 1 ? baseSize : baseSize * aspect;
    const planeHeight = aspect >= 1 ? baseSize / aspect : baseSize;

    const material = useMemo(() => new THREE.MeshStandardMaterial({
        map: colorMap,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.8,
    }), [colorMap]);

    return (
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <planeGeometry args={[planeWidth, planeHeight]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}

function RealisticHologram({ imageUrl, depthUrl, mode }: { imageUrl: string, depthUrl: string, mode: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Load both textures
    const [colorMap, depthMap] = useLoader(THREE.TextureLoader, [imageUrl, depthUrl]);

    // Calculate aspect ratio
    const { width, height } = colorMap.image;
    const aspect = width / height;

    // Base size
    const baseSize = 3;
    const planeWidth = aspect >= 1 ? baseSize : baseSize * aspect;
    const planeHeight = aspect >= 1 ? baseSize / aspect : baseSize;

    // Memoize material to avoid re-creation
    const material = useMemo(() => {
        const isClay = mode === 'clay';
        const isWire = mode === 'wireframe';

        return new THREE.MeshStandardMaterial({
            map: (isClay || isWire) ? null : colorMap,
            color: (isClay || isWire) ? 0xdddddd : 0xffffff,
            displacementMap: depthMap,
            displacementScale: 3.0,
            displacementBias: -0.5,
            transparent: true,
            alphaMap: (isClay || isWire) ? colorMap : null, // Use color alpha for cutout in clay mode
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            metalness: isClay ? 0.3 : 0.2,
            roughness: isClay ? 0.8 : 0.7,
            wireframe: isWire,
        });
    }, [colorMap, depthMap, mode]);

    // Geometry with high segments for displacement
    const geometry = useMemo(() => new THREE.PlaneGeometry(planeWidth, planeHeight, 300, 300), [planeWidth, planeHeight]);

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            position={[0, 0.5, 0]}
            castShadow
            receiveShadow
        />
    );
}

export default function DepthHologram() {
    const imageUrl = useStudioStore((state) => state.imageUrl);
    const depthMapUrl = useStudioStore((state) => state.depthMapUrl);
    const viewMode = useStudioStore((state) => state.viewMode);

    if (!imageUrl) return null;

    return (
        <React.Suspense fallback={null}>
            {depthMapUrl ? (
                <RealisticHologram
                    key={imageUrl + viewMode}
                    imageUrl={imageUrl}
                    depthUrl={depthMapUrl}
                    mode={viewMode}
                />
            ) : (
                <FlatHologram key={imageUrl + '_flat'} imageUrl={imageUrl} />
            )}
        </React.Suspense>
    );
}
