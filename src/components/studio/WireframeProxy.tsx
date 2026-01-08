'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useFaceModelStore } from '@/store/useFaceModelStore';

export default function WireframeProxy() {
    const meshRef = useRef<THREE.LineSegments>(null);
    const groupRef = useRef<THREE.Group>(null);

    const poseParams = useFaceModelStore((state) => state.poseParams);
    const shapeParams = useFaceModelStore((state) => state.shapeParams);
    const expressionParams = useFaceModelStore((state) => state.expressionParams);
    const isAnalyzing = useFaceModelStore((state) => state.isAnalyzing);
    const landmarksDetected = useFaceModelStore((state) => state.landmarksDetected);
    const subjectType = useFaceModelStore((state) => state.subjectType);

    // Load the external Head Model
    const { nodes } = useGLTF('/head.glb') as any;
    // Usually LeePerrySmith has a mesh named 'LeePerrySmith' or similar. 
    // We'll traverse or just use the first mesh we find if we don't know the name.

    const headGeometry = useMemo(() => {
        let geo: THREE.BufferGeometry | null = null;
        if (nodes && Object.keys(nodes).length > 0) {
            // Try to find a mesh
            Object.values(nodes).forEach((node: any) => {
                if (node.isMesh && !geo) {
                    geo = node.geometry;
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
    });

    return (
        <group ref={groupRef} position={[0, subjectType === 'head' ? 0.3 : 0, 0]}>
            {/* Wireframe Mesh */}
            <lineSegments ref={meshRef} scale={[0.15, 0.15, 0.15]}>
                {wireframeGeo && <primitive object={wireframeGeo} />}
                <lineBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.4} // Increased from 0.15
                    depthTest={true}
                    depthWrite={false}
                />
            </lineSegments>

            {/* Occlusion Mesh (The "Black Filler") */}
            <mesh scale={[0.149, 0.149, 0.149]} geometry={geometry}>
                <meshBasicMaterial
                    color="black"
                    colorWrite={false}
                    depthWrite={true}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>);
}

// Preload
useGLTF.preload('/head.glb');
