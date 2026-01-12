'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useStudioStore } from '@/store/useStudioStore';
import DepthHologram from './DepthHologram';
import WireframeProxy from './WireframeProxy';

const CaptureRegistrar = () => {
    const { gl } = useThree();
    const setGetScreenshot = useStudioStore((state) => state.setGetScreenshot);

    useEffect(() => {
        setGetScreenshot(async () => {
            // Force a render if needed, or just capture current buffer.
            // "preserveDrawingBuffer" might be needed in Canvas config if we capture outside of render loop,
            // but usually valid immediately after render.
            // Simple capture:
            return gl.domElement.toDataURL('image/png');
        });
    }, [gl, setGetScreenshot]);

    return null;
};

// ... SceneSetup ...
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
    const depthMapUrl = useStudioStore((state) => state.depthMapUrl);
    const isExtractingDepth = useStudioStore((state) => state.isExtractingDepth);
    const viewMode = useStudioStore((state) => state.viewMode);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                gl={{ preserveDrawingBuffer: true }} // Important for screenshot capture!
            >
                <React.Suspense fallback={null}>
                    <Center>
                        <group>
                            {/* In "Textured" (2D-3D) mode: Show the Hologram (Image + Displacement) */}
                            {viewMode !== 'clay' && <DepthHologram />}

                            {/* In "White Model" (Clay) mode OR if no depth map yet: Show the Generic 3D Model */}
                            {(viewMode === 'clay' || !depthMapUrl) && <WireframeProxy />}
                        </group>
                    </Center>
                </React.Suspense>


                <SceneSetup />
                <CaptureRegistrar />

                <OrbitControls makeDefault />

                <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                    <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
                </GizmoHelper>
            </Canvas>

            {/* Red Capture Frame */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                border: '2px solid red',
                pointerEvents: 'none',
                zIndex: 10,
                boxSizing: 'border-box'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: 'red',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    fontWeight: 'bold'
                }}>
                    CAPTURE AREA
                </div>
            </div>

            {/* Loading Overlay */}
            {isExtractingDepth && (
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
