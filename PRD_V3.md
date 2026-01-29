# Virtual Digital Studio (VDS) - 产品需求文档 (PRD)

**版本**: v5.0 (2026-01-29)  
**状态**: 正式更新  
**更新日期**: 2026.1.29

---

## 1. 项目概述 (Project Overview)
**Virtual Digital Studio (VDS)** 是一款基于 **Next.js 16** 和 **FastAPI** 构建的摄影工作室级 AI 图像生成平台。通过集成 **Three.js** 3D 仿真环境与 **Google Vertex AI (Gemini 3 Pro)**，VDS 支持用户在虚拟影棚中精确布置灯光、调整相机参数，并生成原生 4K/2K 超高清摄影作品。

---

## 2. 技术栈 (Tech Stack)

### 2.1 前端 (Frontend)
- **框架**: Next.js 16.1.1 (App Router + Turbopack)
- **渲染**: React 19.2.3
- **3D 引擎**: Three.js, React Three Fiber, Drei
- **状态管理**: Zustand 5.0.9
- **组件库**: Lucide React, Vanilla CSS

### 2.2 后端 (Backend)
- **框架**: FastAPI + Uvicorn
- **核心服务**: 
  - `GeminiImageService`: Vertex AI 图像生成
  - `GeminiTextService`: Persona 解释
  - `TaskQueue`: 异步任务队列管理

### 2.3 数据库与认证
- **ORM**: Prisma 5.21.1
- **数据库**: PostgreSQL
- **认证**: NextAuth.js

---

## 3. 核心数据流 (Core Data Flows)

### 3.1 异步任务队列架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端组件                                   │
│  (Inspector / PersonaResult / FaceSwapResult)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ submitGenericTask()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useStudioStore                                │
│  - addActiveTask(taskItem)                                      │
│  - startTaskPoller()                                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST /api/py/tasks/submit/*
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    api_server.py                                 │
│  - /tasks/submit/generate                                       │
│  - /tasks/submit/persona                                        │
│  - /tasks/{task_id} (轮询端点)                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 gemini_image_service.py                          │
│  - _run_generation()                                            │
│  - 重试逻辑: max_retries=10, timeout=180s                        │
│  - 支持 429 Rate Limit 和 Timeout 自动重试                        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 首页 3D 视图生成流程

```
Inspector "Bake Angles" 按钮
        ↓
store.generateImage()
        ↓
POST /api/py/tasks/submit/generate
{
  prompt, images, shot_preset, lighting_preset, focal_length,
  aspect_ratio, image_size, guidance_scale, negative_prompt, enhance_prompt
}
        ↓
任务队列处理 → Poller 轮询
        ↓
setGeneratedImage() → RenderView 显示
```

### 3.3 数字人 (Persona) 生成流程

```
PersonaResult "生成" 按钮
        ↓
submitGenericTask('/api/py/tasks/submit/persona', {
  persona, image_size, aspect_ratio
}, 'persona', 'Persona Generation')
        ↓
任务队列处理 → Poller 轮询
        ↓
activeTasks[completed].thumbnail → PersonaResult 显示
```

### 3.4 换脸 (Face Swap) 生成流程

```
FaceSwap "换脸" 按钮
        ↓
submitGenericTask('/api/py/tasks/submit/generate', {
  prompt, images: [targetImage, faceImage],
  image_size, aspect_ratio, negative_prompt
}, 'faceswap', 'Face Swap')
        ↓
任务队列处理 → Poller 轮询
        ↓
activeTasks[completed].thumbnail → FaceSwapResult 显示
```

### 3.5 统一提取流程 (Extraction)

```
提取按钮 (面部/全身/一键生成)
        ↓
handleExtract(mode: 'headshot' | 'turnaround' | 'all')
        ↓
submitGenericTask('/api/py/tasks/submit/generate', {
  prompt: VIEW_PROMPTS.HEADSHOT_GRID / TURNAROUND_SHEET,
  aspect_ratio: "1:1" / "4:3",
  image_size: resolution,
  images: [activeImage]
}, 'extraction', 'Extracting Headshot/Turnaround')
        ↓
任务完成后通过 t.name?.includes('Headshot'/'Turnaround') 匹配
        ↓
derivedExtractedAssets → UI 显示
```

---

## 4. TaskItem 数据结构

```typescript
interface TaskItem {
    id: string;                    // 后端返回的 task_id
    type: string;                  // 'generation' | 'persona' | 'faceswap' | 'extraction'
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    progress: number;              // 0-100
    message: string;               // 状态消息
    startTime: number;             // 任务开始时间
    prompt: string;                // 原始 prompt
    name?: string;                 // UI 显示名称 (用于提取任务匹配)
    thumbnail?: string;            // 完成后的 base64 结果
}
```

---

## 5. API 端点清单

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/py/tasks/submit/generate` | POST | 通用图像生成 |
| `/api/py/tasks/submit/persona` | POST | 数字人生成 |
| `/api/py/tasks/{task_id}` | GET | 任务状态轮询 |
| `/api/py/interpret` | POST | Persona 文本解释 |

---

## 6. 核心功能模块

### 6.1 3D 工作室 (Studio)
- **Viewport3D**: Three.js 实时渲染
- **Inspector**: 灯光/相机控制 + 生成参数配置
- **RenderView**: 生成结果显示

### 6.2 数字人 (Persona)
- **MagicInput**: 智能输入 (文本/图片)
- **PersonaEditor**: DNA 参数编辑
- **PersonaResult**: 生成 + 提取结果显示

### 6.3 换脸 (Face Swap)
- **FaceSwapEditor**: 目标图/人脸图上传
- **FaceSwapResult**: 结果 + 提取显示

### 6.4 作品库 (Library)
- 瀑布流展示、详情弹窗、Remix、下载

---

## 7. 指令说明

```bash
npm run dev      # 启动 Next.js (端口 9229)
npm run gemini   # 启动 FastAPI (端口 8000)
npx prisma db push
```

---

## 8. 重要技术决策

1. **任务队列架构**: 所有生成改为异步提交 + 轮询，避免 HTTP 超时
2. **localStorage 优化**: `activeTasks` 不持久化，防止 base64 数据溢出
3. **统一提取流程**: 所有页面共享相同的 extraction 任务类型和匹配逻辑
4. **重试机制**: 后端支持 Rate Limit (429) 和 Timeout 自动重试

---

*制作: 奕帆 & AI Assistant*  
*最后更新: 2026.01.29 12:43*
