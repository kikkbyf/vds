'use client';

import React, { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '@/store/useStudioStore';

// Fallback Component for Flat Image (No Depth)
function FlatHologram({ imageUrl, mode }: { imageUrl: string, mode: string }) {
    const colorMap = useLoader(THREE.TextureLoader, imageUrl);
    const { width, height } = colorMap.image;
    const aspect = width / height;

    const baseSize = 3;
    const planeWidth = aspect >= 1 ? baseSize : baseSize * aspect;
    const planeHeight = aspect >= 1 ? baseSize / aspect : baseSize;

    const material = useMemo(() => {
        const isClay = mode === 'clay';
        const mat = new THREE.MeshStandardMaterial({
            map: colorMap,
            color: isClay ? 0xdddddd : 0xffffff,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            metalness: isClay ? 0.3 : 0.1,
            roughness: isClay ? 0.8 : 0.5,
        });

        if (isClay) {
            mat.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <map_fragment>',
                    `
                    #ifdef USE_MAP
                        vec4 texelColor = texture2D( map, vMapUv );
                        diffuseColor *= texelColor.a;
                    #endif
                    `
                );
            };
            mat.customProgramCacheKey = () => 'clay_flat';
        }
        return mat;
    }, [colorMap, mode]);

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
    // Note: useLoader caches.
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

        const mat = new THREE.MeshStandardMaterial({
            map: colorMap, // Always use colorMap to get the Alpha Channel
            color: (isClay || isWire) ? 0xffffff : 0xffffff, // Pure white for clay
            displacementMap: depthMap,
            displacementScale: 3.0,
            displacementBias: -0.5,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            metalness: isClay ? 0.0 : 0.2, // No metalness for matte clay
            roughness: isClay ? 1.0 : 0.7, // Fully rough
            emissive: isClay ? 0x222222 : 0x000000, // Slight ambient glow to prevent total black occlusion
            wireframe: isWire,
        });

        // Custom Shader Logic for Clay Mode
        if (isClay || isWire) {
            mat.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <map_fragment>',
                    `
                    #ifdef USE_MAP
                        vec4 texelColor = texture2D( map, vMapUv );
                        // Key fix: Use the texture's alpha, but ignore its RGB (use material color instead)
                        diffuseColor *= texelColor.a; 
                    #endif
                    `
                );
            };
            // Ensure unique compiled program cache to avoid conflicts
            mat.customProgramCacheKey = () => mode;
        }

        return mat;
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
                <FlatHologram
                    key={imageUrl + viewMode + '_flat'}
                    imageUrl={imageUrl}
                    mode={viewMode}
                />
            )}
        </React.Suspense>
    );
}
