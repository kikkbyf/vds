# Virtual Digital Studio (VDS) - Product Requirements Document (PRD)

## 1. Project Overview
**Virtual Digital Studio (VDS)** is a full-stack AI-powered photography simulation platform. It enables users to visualize 3D models in a controlled studio environment and generate high-fidelity, cinematic fashion photographs using Google Vertex AI (Gemini 3 Pro).

## 2. Core Features

### 2.1 3D Studio (Frontend)
- **Interactive Viewport**: Real-time 3D model visualization using Three.js and React Three Fiber.
- **View Modes**: Supports `Textured`, `Clay`, and `Wireframe` visualization modes.
- **Camera Control**: Interactive OrbitControls for model inspection and angle adjustment.
- **Studio Tools**: Integrated GizmoHelper and multi-angle stability indicators.

### 2.2 AI Generation Pipeline
- **Gemini 3 Pro Integration**: Native 1K, 2K, and 4K image generation using `gemini-3-pro-image-preview`.
- **Image-to-Image (I2I)**: Generate new images based on user-uploaded references and viewport captures.
- **Text-to-Image (T2I)**: Generate images from descriptive prompts with optional reference influence.
- **Prompt Engineering**: Automated prompt generation based on shot presets (closeup, fullbody), lens settings, and lighting presets.
- **Generation Controls**: Custom aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16), guidance scale, and negative prompt support.

### 2.3 Image Processing & Analysis
- **Background Removal**: WASM-based background removal using `@imgly/background-removal`.
- **Depth Map Extraction**: Web Worker-based depth map computation for 3D model analysis.
- **Viewport Capture**: Instant high-quality screenshots of the 3D scene for use as generation structural references.

## 3. Current Progress Summary (Jan 13, 2026)
- [x] **Core Infrastructure**: Frontend (Next.js) and Backend (FastAPI) communication established.
- [x] **Native 4K Generation**: Successfully bypassed SDK limitations to achieve direct 4K/2K generation via raw REST API calls.
- [x] **Zustand State Store**: robust `useStudioStore` for managing application state, persistence, and complex generation flows.
- [x] **3D Viewport**: Functional head model visualization with multiple render modes.
- [x] **UI Layout**: Triple-panel cinematic interface (Studio, Render, Inspector).
- [ ] **Multi-Model Support**: Currently optimized for head models; full-body support is in progress.
- [ ] **Advanced Inpainting**: Seamless editing of generated images.

## 4. Technical Architecture

### 4.1 Folder Structure
```text
fasionphotoeditor/
├── src/
│   ├── app/                # Next.js App Router (Layouts & Pages)
│   ├── components/
│   │   ├── layout/         # UI Panels (Inspector, Toolbar)
│   │   ├── studio/         # 3D Engine & Render Views (Viewport3D, RenderView)
│   ├── interface/
│   │   └── types/          # Shared Pydantic/TS Types
│   ├── services/           # Business Logic (GeminiImageService)
│   ├── store/              # Zustand State Management
│   ├── utils/              # Prompting & Image Helpers
│   └── workers/            # Heavy Compute (Depth Mapping)
├── public/                 # Static Assets (3D Models, Icons)
├── api_server.py           # FastAPI Main Entry
├── scripts/                # Dev & Build Automation
├── README.md               # Setup Guide
├── PRD.md                  # Product Requirements (This Document)
└── AGENTS.md               # Repository Guidelines
```

### 4.2 Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Three.js, Zustand.
- **Backend**: Python 3.10+, FastAPI, Google GenAI SDK (custom REST implementation).
- **Hosting/Cloud**: Google Cloud Platform (Vertex AI).
