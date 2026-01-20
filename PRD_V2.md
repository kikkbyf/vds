# Virtual Digital Studio (VDS) - 产品需求文档 (PRD)

**版本**: v4.0 (2026-01-20 18:01)  
**状态**: 正式更新  
**更新日期**: 2026.1.20

---

## 1. 项目概述 (Project Overview)
**Virtual Digital Studio (VDS)** 是一款基于 **Next.js 16** 和 **FastAPI** 构建的摄影工作室级 AI 图像生成平台。通过集成 **Three.js** 3D 仿真环境与 **Google Vertex AI (Gemini 3 Pro)**，VDS 支持用户在虚拟影棚中精确布置灯光、调整相机参数，并生成原生 4K/2K 超高清摄影作品。它通过数字化的方式模拟真实的摄影棚拍摄流程，大幅降低商业摄影的成本。

---

## 2. 技术栈 (Tech Stack)

### 2.1 前端 (Frontend)
- **框架**: Next.js 16.1.1 (App Router + Turbopack)
- **渲染**: React 19.2.3
- **3D 引擎**: Three.js, React Three Fiber (@react-three/fiber), Drei (@react-three/drei)
- **状态管理**: Zustand 5.0.9 (用于持久化灯光、配置及用户状态)
- **组件库**: Lucide React (图标), Vanilla CSS (模块化方案)
- **客户端逻辑**: 背景移除 (@imgly/background-removal), ONNX Runtime Web

### 2.2 后端 (Backend)
- **语言**: Python 3.10+
- **框架**: FastAPI
- **运行时**: Uvicorn
- **核心服务**: 
  - `GeminiImageService`: 封装 Vertex AI REST API，支持 Image-to-Image 与 Text-to-Image。
  - `GeminiTextService`: 调用 Gemini Flash 进行 Persona 角色解释。
  - `PromptCompiler`: 将结构化参数编译为专业摄影提示词。

### 2.3 数据库与认证 (Database & Auth)
- **ORM**: Prisma 5.21.1
- **数据库**: PostgreSQL
- **认证**: NextAuth.js (Auth.js v5 beta)

---

## 3. 核心功能模块 (Core Modules)

### 3.1 3D 工作室 (Studio)
- **Viewport3D**: 基于 Three.js 的实时渲染窗口，支持 `Clay` (粘土)、`Textured` (贴图)、`Wireframe` (线框) 三种模式。
- **灯光控制器 (Inspector)**: 预设选择模式（如：伦勃朗光、蝴蝶光、柔光箱等），用于控制 AI 生成的布光风格。交互式调节为下阶段目标。
- **相机模拟**: 支持从 24mm 到 200mm 的物理焦段模拟，并同步 3D 视口。
- **截图生成**: 自动捕捉当前 3D 构图作为 AI 生成的结构约束 (Reference)。

### 3.2 角色实验室 (Persona)
- **AI 角色设计**: 利用 Gemini Flash 将用户简单的描述（如“金发北欧女性”）自动补全为包含年龄、种族、肤质细节、服装风格的完整 JSON 角色规格。
- **提示词编译**: 自动将角色配置转换为符合 Gemini 3 Pro 审美的结构化 Prompt。

### 3.3 作品库 (Library)
- **瀑布流展示**: 查看所有历史生成结果。
- **详情弹窗**: 支持图片自适应视口缩放 (3:4 比例优化)，支持 Remix (参数重用) 和 4K 下载。
- **会话分组 (Session Logic)**: 支持将同一创作过程中的多次生成进行逻辑关联。

### 3.4 管理后台 (Admin)
- **用户管理**: 查看所有注册用户，支持审核、拒绝及拉黑功能。
- **积分系统**: 
  - **计费规则**: 1K 消耗 1 积分，2K 消耗 2 积分，4K 消耗 5 积分。
  - **退款机制**: 生成失败自动通过 Prisma 事务退还积分。
- **系统监控**: 查看实时生成日志及交易流向。

---

## 4. 目录结构 (Folder Hierarchy)

```text
fasionphotoeditor/
├── prisma/                 # 数据库模型 (User, Creation, CreditLog, etc.)
├── scripts/                # 自动化指令 (dev-start, migrate, create-admin)
├── src/
│   ├── app/                # Next.js 路由 (API, Library, Persona, Studio)
│   ├── components/         # UI 组件 (layout, studio, library, UI 元素)
│   ├── interface/          # TypeScript 类型定义
│   ├── lib/                # Prisma 实例与共享库
│   ├── services/           # Python 后端核心逻辑 (__pycache__, service.py)
│   ├── store/              # Zustand 状态定义
│   └── workers/            # Web Worker (如深度图计算)
├── api_server.py           # FastAPI 入口
├── Dockerfile              # 多阶段构建容器定义
└── start.sh                # 生产环境/容器启动脚本
```

---

## 5. 数据库表结构 (Database Schema)

- **User**: 核心用户信息、角色权限、积分余额、审批状态。
- **Creation**: 记录生成的完整快照，包含 Prompt、预设参数、输入输出图片 URL。
- **CreditLog**: 记录每一笔积分变动（生成消耗、退款、管理员调整）。
- **PromptTemplate**: 用户保存的常用提示词模版。
- **SystemConfig**: 系统级配置开关。

---

## 6. 指令说明 (Commands)

- **启动开发环境**: `npm run dev` (通过 scripts/dev-start.sh 启动 Next.js 9229 端口)
- **启动后端服务**: `npm run gemini` (启动 FastAPI 8000 端口)
- **数据库同步**: `npx prisma db push`
- **生成管理**: `node scripts/create-admin.js`

---

## 7. 路线图与后续目标 (Roadmap)
- **当前状态**: 已完成高分辨率生成管线、3D 灯光解耦、积分闭环系统。
- **后续优化**: 引入全身动作同步 (Pose Control)、资产本地持久化加速、多人协作工作室。

---
*制作: 奕帆 & AI Assistant*  
*最后更新: 2026.01.20 18:01*
