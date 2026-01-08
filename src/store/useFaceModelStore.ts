import { create } from 'zustand';

interface FaceModelState {
    // FLAME 参数模拟 (FLAME Parameters Mock)
    // 真实的 3D 重建会生成这些参数来驱动 Mesh
    shapeParams: number[];      // 100个浮点数，控制脸型胖瘦、骨骼形状 (Shape: 100 floats)
    expressionParams: number[]; // 50个浮点数，控制表情 (Expression: 50 floats)
    poseParams: [number, number, number]; // 欧拉角，控制头部/颈部旋转 (Euler angles [x, y, z])

    subjectType: 'head' | 'body'; // 当前主体类型：头 vs 全身

    isAnalyzing: boolean;
    landmarksDetected: boolean;

    // Actions
    setSubjectType: (type: 'head' | 'body') => void;
    startAnalysis: () => Promise<void>;
    resetModel: () => void;
}

const generateRandomParams = (count: number) =>
    Array.from({ length: count }, () => (Math.random() - 0.5) * 0.5);

export const useFaceModelStore = create<FaceModelState>((set) => ({
    shapeParams: new Array(100).fill(0),
    expressionParams: new Array(50).fill(0),
    poseParams: [0, 0, 0],
    subjectType: 'head',
    isAnalyzing: false,
    landmarksDetected: false,

    setSubjectType: (type) => set({ subjectType: type }),

    startAnalysis: async () => {
        set({ isAnalyzing: true, landmarksDetected: false });

        // 模拟 API / MediaPipe 延迟与计算过程
        // Simulate API / MediaPipe Latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        set({
            isAnalyzing: false,
            landmarksDetected: true,
            // 模拟重建后的参数结果 (Mock "Reconstruction" Result)
            shapeParams: generateRandomParams(100),
            expressionParams: generateRandomParams(50),
            poseParams: [
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                0
            ] as [number, number, number]
        });
    },

    resetModel: () => set({
        shapeParams: new Array(100).fill(0),
        expressionParams: new Array(50).fill(0),
        poseParams: [0, 0, 0],
        landmarksDetected: false
    })
}));
