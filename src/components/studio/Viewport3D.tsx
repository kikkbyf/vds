'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useStudioStore } from '@/store/useStudioStore';
import DepthHologram from './DepthHologram';
import WireframeProxy from './WireframeProxy';

function SceneSetup() {
    const focalLength = useStudioStore((state) => state.focalLength);
    const { camera } = useThree();

    useEffect(() => {
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.setFocalLength(focalLength);
            camera.updateProjectionMatrix();
        }
    }, [focalLength, camera]);

    return (
        <>
            <gridHelper args={[20, 20, 0x444444, 0x222222]} />
            <axesHelper args={[2]} />
            <ambientLight intensity={0.5} />
        </>
    );
}

export default function Viewport3D() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <React.Suspense fallback={null}>
                    <Center>
                        <group>
                            {/* The Particle Hologram (Volumetric Body) */}
                            {/* The Depth Hologram (AI-Powered 2.5D Displacement) */}
                            <DepthHologram />

                            {/* The Techy Wireframe Overlay (Only show if no Hologram yet) */}
                            {!useStudioStore.getState().depthMapUrl && <WireframeProxy />}
                        </group>
                    </Center>
                </React.Suspense>

                <SceneSetup />

                <OrbitControls makeDefault />

                <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                    <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
                </GizmoHelper>
            </Canvas>

            {/* Loading Overlay */}
            {useStudioStore.getState().isExtractingDepth && (
                <div style={{
                    position: 'absolute', top: 20, left: 20,
                    background: 'rgba(0,0,0,0.7)', color: 'white',
                    padding: '8px 12px', borderRadius: 4, fontSize: 12,
                    pointerEvents: 'none'
                }}>
                    🧠 Estimating Depth...
                </div>
            )}
        </div>
    );
}
