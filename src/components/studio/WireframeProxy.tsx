'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { GLTF } from 'three-stdlib';
import { useFaceModelStore } from '@/store/useFaceModelStore';

type HeadGLTF = GLTF & { nodes: Record<string, THREE.Object3D> };

export default function WireframeProxy() {
    const meshRef = useRef<THREE.LineSegments>(null);
    const groupRef = useRef<THREE.Group>(null);

    const isAnalyzing = useFaceModelStore((state) => state.isAnalyzing);
    const landmarksDetected = useFaceModelStore((state) => state.landmarksDetected);
    const subjectType = useFaceModelStore((state) => state.subjectType);

    // Load the external Head Model
    const { nodes } = useGLTF('/head.glb') as HeadGLTF;
    // Usually LeePerrySmith has a mesh named 'LeePerrySmith' or similar. 
    // We'll traverse or just use the first mesh we find if we don't know the name.

    const headGeometry = useMemo(() => {
        let geo: THREE.BufferGeometry | null = null;
        if (nodes && Object.keys(nodes).length > 0) {
            Object.values(nodes).forEach((node) => {
                const mesh = node as THREE.Mesh;
                if (mesh.isMesh && !geo && mesh.geometry) {
                    geo = mesh.geometry as THREE.BufferGeometry;
                }
            });
        }
        return geo || new THREE.IcosahedronGeometry(1, 4); // Fallback
    }, [nodes]);

    // Geometry Strategy
    const geometry = useMemo(() => {
        if (subjectType === 'head') {
            return headGeometry;
        } else {
            // Body Capsule
            return new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        }
    }, [subjectType, headGeometry]);

    // Clone geometry to ensure unique instance for cloning if needed (optional)
    // create wireframe geo
    const wireframeGeo = useMemo(() => {
        if (!geometry) return null;
        return new THREE.WireframeGeometry(geometry);
    }, [geometry]);

    useFrame((state) => {
        if (meshRef.current) {
            // Force reset rotation - Static
            meshRef.current.rotation.set(0, 0, 0);

            // Scanning Pulse (Color)
            const material = meshRef.current.material as THREE.LineBasicMaterial;
            if (isAnalyzing) {
                material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 10) * 0.3; // Much brighter pulse
                material.color.setHex(0x00ff88);
            } else if (landmarksDetected) {
                material.opacity = 0.4; // Brighter static state
                material.color.setHex(0xffffff);
            } else {
                material.opacity = 0.4; // Brighter default state
                material.color.setHex(0xffffff);
            }
        }
    }); // End useFrame

    // User requested "White Model" to be exactly the original wireframe.
    // So we render the wireframe regardless of the view mode here.

    return (
        <group ref={groupRef} position={[0, subjectType === 'head' ? 0.3 : 0, 0]}>
            {/* Wireframe Mesh - Always Visible */}
            <lineSegments ref={meshRef} scale={[0.15, 0.15, 0.15]}>
                {wireframeGeo && <primitive object={wireframeGeo} />}
                <lineBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.4}
                    depthTest={true}
                    depthWrite={false}
                />
            </lineSegments>

            {/* Occlusion Mesh (Black Filler) - Always Visible to hide back lines */}
            <mesh scale={[0.149, 0.149, 0.149]} geometry={geometry || undefined}>
                <meshBasicMaterial
                    color="black"
                    colorWrite={false}
                    depthWrite={true}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// Preload
useGLTF.preload('/head.glb');
