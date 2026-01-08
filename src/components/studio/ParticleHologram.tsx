'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '@/store/useStudioStore';

function ParticleSystem({ imageUrl }: { imageUrl: string }) {
    const pointsRef = useRef<THREE.Points>(null);

    // Use loader to get the image data
    const texture = useLoader(THREE.TextureLoader, imageUrl);

    const [geometryData, setGeometryData] = useState<{ positions: Float32Array; colors: Float32Array } | null>(null);

    useEffect(() => {
        if (!texture.image) return;

        const img = texture.image;
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;

        // Limits
        const MAX_POINTS = 400000;
        let step = 1;
        if (width * height > MAX_POINTS) {
            step = Math.ceil(Math.sqrt((width * height) / MAX_POINTS));
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw image to canvas to read pixel data
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, width, height).data;

        const positions = [];
        const colors = [];

        // World scale factors
        const worldScale = 5 / height; // Height of ~5 units

        // 扫描线处理：逐行扫描像素以确定每一行的“轮廓范围”
        // Scanline processing to determine silhouette bounds
        // 我们假设图片已经完成了去背处理 (Alpha 通道是关键)
        // We assume the image has been background-removed (Alpha is key)

        for (let y = 0; y < height; y += step) {
            // 1. 寻找当前行的人体/物体边界 (Find the bounds of the "body" on this row)
            let minX = width;
            let maxX = 0;
            let hasPixels = false;

            // 第一遍遍历：确定轮廓的左边界(minX)和右边界(maxX)
            // First pass: find silhouette
            for (let x = 0; x < width; x += step) {
                const i = (y * width + x) * 4;
                const alpha = data[i + 3];
                if (alpha > 40) { // Alpha 阈值，忽略半透明噪点 (Threshold)
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    hasPixels = true;
                }
            }

            if (!hasPixels) continue;

            // 计算当前行的中心点和半径，这是“膨胀算法”的基础
            const centerX = (minX + maxX) / 2;
            const radius = (maxX - minX) / 2;

            // 2. 生成带有“膨胀”深度的粒子 (Generate particles with "Inflation" depth)
            // 这就是我们将 2D 转为 3D 的核心魔法
            for (let x = minX; x <= maxX; x += step) {
                const i = (y * width + x) * 4;
                const alpha = data[i + 3];

                if (alpha > 40) {
                    const r = data[i] / 255;
                    const g = data[i + 1] / 255;
                    const b = data[i + 2] / 255;

                    // 计算当前像素相对于中心轴的归一化位置 (-1 到 1)
                    // Normalized offset from center axis (-1 to 1)
                    // Avoid division by zero
                    const normX = radius > 0 ? (x - centerX) / radius : 0;

                    // 基于圆形截面假设计算 Z 轴深度 (拟合圆柱体/胶囊体表面)
                    // Calculate Z based on circular cross-section assumption
                    // Clamp for safety
                    const safeNormX = Math.max(-1, Math.min(1, normX));
                    const depthFactor = Math.sqrt(1 - safeNormX * safeNormX);

                    // 转换为世界坐标系
                    // World Coordinates
                    const px = (x - width / 2) * worldScale;
                    const py = (height - y - height / 2) * worldScale;

                    // 膨胀幅度：基于物体当前的宽度(radius)决定它有多“厚”
                    // Inflation Magnitude: radius determines thickness
                    // We can tweak '0.6' to make the person flatter or rounder
                    const pz = depthFactor * (radius * worldScale) * 0.6;

                    // 将计算出的 3D 坐标推入数组 (Push the front point)
                    positions.push(px, py, pz);
                    colors.push(r, g, b);
                }
            }
        }

        setGeometryData({
            positions: new Float32Array(positions),
            colors: new Float32Array(colors)
        });

    }, [texture, imageUrl]);

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
