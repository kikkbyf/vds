'use client';

import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStudioStore } from '@/store/useStudioStore';
import DepthHologram from './DepthHologram';
import WireframeProxy from './WireframeProxy';
import { useFrame } from '@react-three/fiber';

const CaptureRegistrar = () => {
    const { gl } = useThree();
    const setGetScreenshot = useStudioStore((state) => state.setGetScreenshot);

    useEffect(() => {
        setGetScreenshot(() => {
            // Force a render if needed, or just capture current buffer.
            // "preserveDrawingBuffer" is enabled in Canvas config.
            return gl.domElement.toDataURL('image/png');
        });
    }, [gl, setGetScreenshot]);

    return null;
};

// ... SceneSetup ...
// Camera Info Overlay Component
function CameraInfo() {
    const { camera } = useThree();
    const [info, setInfo] = React.useState({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 });

    useFrame(() => {
        setInfo({
            x: parseFloat(camera.position.x.toFixed(2)),
            y: parseFloat(camera.position.y.toFixed(2)),
            z: parseFloat(camera.position.z.toFixed(2)),
            rotX: parseFloat(THREE.MathUtils.radToDeg(camera.rotation.x).toFixed(1)),
            rotY: parseFloat(THREE.MathUtils.radToDeg(camera.rotation.y).toFixed(1)),
            rotZ: parseFloat(THREE.MathUtils.radToDeg(camera.rotation.z).toFixed(1)),
        });
    });

    return (
        <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }} as='div' fullscreen>
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(0,0,0,0.6)',
                color: '#eee',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                display: 'flex',
                pointerEvents: 'none',
                flexDirection: 'column',
                gap: '4px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '2px', fontWeight: 'bold', color: '#fff' }}>
                    CAMERA STATE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '15px 1fr', gap: '4px' }}>
                    <span style={{ color: '#ff6b6b' }}>X</span> {info.x} / {info.rotX}°
                    <span style={{ color: '#51cf66' }}>Y</span> {info.y} / {info.rotY}°
                    <span style={{ color: '#339af0' }}>Z</span> {info.z} / {info.rotZ}°
                </div>
            </div>
        </Html>
    );
}

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
            {/* Floor Grid - slightly lowered to avoid z-fighting with shadows */}
            <gridHelper args={[20, 20, 0x444444, 0x222222]} position={[0, -0.01, 0]} />
            <axesHelper args={[2]} position={[0, 0.01, 0]} />
            <ambientLight intensity={0.5} />
        </>
    );
}

export default function Viewport3D() {
    const depthMapUrl = useStudioStore((state) => state.depthMapUrl);
    const isExtractingDepth = useStudioStore((state) => state.isExtractingDepth);
    const viewMode = useStudioStore((state) => state.viewMode);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                gl={{ preserveDrawingBuffer: true }} // Important for screenshot capture!
            >
                <React.Suspense fallback={null}>
                    {/* Manual positioning group to lift model above grid */}
                    <group position={[0, 1.8, 0]}>
                        {/* In "Textured" (2D-3D) mode: Show the Hologram (Image + Displacement) */}
                        {viewMode !== 'clay' && <DepthHologram />}

                        {/* In "White Model" (Clay) mode OR if no depth map yet: Show the Generic 3D Model */}
                        {(viewMode === 'clay' || !depthMapUrl) && <WireframeProxy />}
                    </group>
                </React.Suspense>


                <SceneSetup />
                <CaptureRegistrar />

                <OrbitControls makeDefault />

                <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                    <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
                </GizmoHelper>

                <CameraInfo />
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

            {/* Camera Info Overlay */}
            <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 20 }}>
                {/* We render the React component inside the Canvas via Portal or simpler: just verify we can access context. 
                    Actually, accessing useThree() outside Canvas is impossible. 
                    So we need to place a component INSIDE Canvas that writes to a store or simpler: render HTML OVERLAY.
                    BUT useFrame only works inside Canvas. 
                    
                    Optimized Approach: 
                    Render CameraInfo INSIDE Canvas but return Html? No, simpler to just portal or use a Store.
                    
                    Let's just put <CameraInfo /> inside the Canvas, but use <Html> from drei? 
                    Actually, simplest is to use <Html> from @react-three/drei inside CameraInfo.
                */}
            </div>
        </div>
    );
}
