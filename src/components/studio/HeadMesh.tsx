'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFaceModelStore } from '@/store/useFaceModelStore';

export default function HeadMesh() {
    const { isAnalyzing, landmarksDetected, poseParams } = useFaceModelStore();
    const meshRef = useRef<THREE.LineSegments>(null);
    const groupRef = useRef<THREE.Group>(null);

    // 1. Base Geometry: High detail Icosahedron to approximate a head sphere
    const geometry = useMemo(() => {
        return new THREE.IcosahedronGeometry(1.2, 4); // Radius 1.2, Detail 4
    }, []);

    // 2. Wireframe Geometry: Explicit LineSegments for the "Techy" look
    const wireframeGeo = useMemo(() => {
        return new THREE.WireframeGeometry(geometry);
    }, [geometry]);

    // Animation: Gentle rotation or "Scanning" pulse
    useFrame((state) => {
        if (groupRef.current) {
            // Lerp to pose params
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, poseParams[0], 0.1);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, poseParams[1], 0.1);
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, poseParams[2], 0.1);

            // Idle float
            if (!isAnalyzing) {
                groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
            }
        }

        if (meshRef.current) {
            // Pulse opacity during analysis
            const material = meshRef.current.material as THREE.LineBasicMaterial;
            if (isAnalyzing) {
                material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
                material.color.setHex(0x00ff88); // Green-ish scanning
            } else if (landmarksDetected) {
                material.opacity = 0.15;
                material.color.setHex(0xffffff); // Stable White
            } else {
                material.opacity = 0.1;
                material.color.setHex(0xaaaaaa); // Idle Grey
            }
        }
    });

    return (
        <group ref={groupRef}>
            <lineSegments ref={meshRef} geometry={wireframeGeo}>
                <lineBasicMaterial
                    color={0xaaaaaa}
                    transparent
                    opacity={0.1}
                    depthTest={false} // X-ray look
                    linewidth={1}
                />
            </lineSegments>

            {/* Inner "Brain" or Volume - Optional, adds depth */}
            <mesh>
                <icosahedronGeometry args={[1.18, 3]} />
                <meshBasicMaterial color="black" transparent opacity={0.5} />
            </mesh>
        </group>
    );
}
