# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack AI-powered photography simulation tool called the Virtual Digital Studio (VDS). It combines a Next.js frontend with a Python FastAPI backend to provide interactive 3D model visualization and AI-powered image generation using Google Vertex AI (Gemini 3 Pro Image Preview).

**Tech Stack:**
- Frontend: Next.js 16 + React 19 + TypeScript + Three.js/React Three Fiber
- Backend: Python 3.10+ + FastAPI + Uvicorn
- State Management: Zustand
- AI Model: Google Vertex AI Gemini 3 Pro Image Preview
- 3D Graphics: Three.js with interactive controls and depth-based effects

## Common Commands

### Frontend Development
```bash
npm run dev      # Start Next.js dev server on port 9229 with Turbopack
npm run build    # Production build
npm start        # Serve production build
npm run lint     # Run ESLint
```

### Backend Development
```bash
npm run gemini   # Start FastAPI backend on port 8000
                 # Equivalent to: ./venv/bin/python3 api_server.py
```

### Testing & Debugging
```bash
python test_gemini_image.py  # Launch Gradio UI for end-to-end Gemini testing
python debug_config.py       # Verify configuration
python debug_sdk.py          # Debug SDK setup
```

### Full Development Setup
Typically run in separate terminal windows:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run gemini
```

The application will be available at `http://localhost:9229` with the FastAPI backend running at `http://127.0.0.1:8000`.

### Environment Setup
Before first run:
```bash
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-dotenv google-genai pydantic
```

## Architecture

### Frontend Structure

**Key Directories:**
- `src/app/` - Next.js App Router pages and layouts
- `src/components/studio/` - 3D viewport and rendering components (Three.js)
- `src/components/layout/` - UI control panels and inspector
- `src/store/` - Zustand state stores (useStudioStore, useFaceModelStore)
- `src/utils/` - Utility functions (image processing, prompt generation)
- `src/services/` - Service layer (Gemini integration)
- `src/workers/` - Web Workers (depth map computation)
- `public/` - Static assets including 3D head model (head.glb)

**Main UI Layout:**
The application uses a 3-panel grid layout:
1. **Studio Panel (left)** - Interactive 3D viewport with OrbitControls
2. **Render Panel (center)** - Cinematic output display
3. **Inspector Panel (right)** - Generation controls, presets, and settings

**Key Components:**
- `src/components/studio/Viewport3D.tsx` - Three.js canvas with 3D model
- `src/app/page.tsx` - Main layout orchestrating the 3-panel interface
- `src/store/useStudioStore.ts` - Central state management for app configuration, images, generation progress

### Backend Structure

**API Server:** `api_server.py`
- FastAPI application with CORS enabled for local development
- Main endpoint: `POST /generate` - Accepts prompts, images, and generation config
- Routes to `GeminiImageService` for processing

**Core Service:** `src/services/gemini_image_service.py`
- Handles Google Vertex AI integration
- Text-to-image and image-to-image generation
- Image format conversion and MIME type detection
- Response parsing from Gemini API

### Generation Pipeline

1. User selects shot preset (closeup/fullbody/cowboy), lens, lighting via Inspector
2. System generates prompt using `promptUtils.generatePrompt()`
3. User uploads reference images and/or captures 3D viewport
4. Frontend sends all images + prompt to `http://127.0.0.1:8000/generate`
5. Backend calls Google Vertex AI with Gemini 3 Pro Image Preview model
6. Response returned as base64 PNG data URI
7. Result displayed in Render Panel with match percentage

### State Management

**Zustand Stores:**
- `useStudioStore` - Central store containing:
  - Current images and viewport state
  - Camera and lighting settings
  - Generation config (aspect ratio, size, guidance scale, negative prompt)
  - Generation progress and results
  - Prompt history and presets
- `useFaceModelStore` - Face/body model analysis state

Use these stores for global UI state; avoid prop drilling for cross-panel communication.

### Key Technologies

**3D Graphics:**
- Three.js with React Three Fiber for React integration
- OrbitControls for interactive model rotation
- GizmoHelper for viewport navigation
- Multiple view modes (clay, textured, wireframe)
- Depth-based hologram and particle effect visualizations

**Image Processing:**
- WASM-based background removal (IMGLY)
- Web Worker for depth map computation (`src/workers/depth-worker.js`)
- Browser-side image format conversion

**Frontend Configuration:**
- TypeScript strict mode enabled
- Path alias configured: `@/*` resolves to `src/*`
- Next.js Turbopack for fast dev builds
- ESLint with Next.js + TypeScript rules

## Coding Standards (from AGENTS.md)

**TypeScript:**
- Use strict mode
- Functional components with hooks
- PascalCase for component names
- camelCase for functions and variables
- kebab-case for file names

**Component Patterns:**
- Use React hooks for state management where possible
- Use Zustand stores for global/cross-panel state
- Dynamic imports for 3D components (disable SSR)

**Testing:**
- ESLint is the primary code quality check (`npm run lint`)
- Backend follows pytest patterns for future unit tests
- Manual end-to-end testing via `python test_gemini_image.py`

**Commits:**
- Use imperative present-tense messages (e.g., "Add feature X", "Fix bug in component Y")
- Focus on the task/change being made
- Reference issue numbers if applicable

## Environment Variables

Required `.env` file (see README.md):
```
GOOGLE_PROJECT_ID=<your-google-cloud-project-id>
GOOGLE_APPLICATION_CREDENTIALS=./google_gemini_service_account.json
```

The Google service account credentials must be obtained from Google Cloud Console and placed as `google_gemini_service_account.json` in the project root.

## Important Files to Know

**Configuration:**
- `tsconfig.json` - TypeScript paths and compiler options
- `next.config.js` - Next.js config with Turbopack and CORS headers
- `eslint.config.mjs` - ESLint rules
- `package.json` - npm scripts and dependencies

**Frontend Entry:**
- `src/app/page.tsx` - Main application layout
- `src/store/useStudioStore.ts` - Primary state management

**Backend Entry:**
- `api_server.py` - FastAPI server entry point

**3D Model:**
- `public/head.glb` - 3D head model asset used in Viewport3D

## Debugging Tips

- **Port Conflicts:** The dev startup script (`scripts/dev-start.sh`) automatically kills processes on port 9229 and cleans lock files
- **Configuration Issues:** Run `python debug_config.py` to verify environment and SDK setup
- **Gemini API Issues:** Use `python test_gemini_image.py` for end-to-end generation testing
- **3D Rendering:** Check browser console for Three.js warnings; verify head.glb loads from `public/`
- **Cross-origin Issues:** CORS is enabled in `next.config.js` for local development

## API Contract

**Frontend → Backend:**
- Endpoint: `POST http://127.0.0.1:8000/generate`
- Request includes: prompt text, reference images (base64), generation config (size, aspect ratio, guidance scale, negative prompt, prompt enhancement flag)
- Response: Base64-encoded PNG image as data URI

## Further Reading

- `README.md` - Setup and installation guide
- `AGENTS.md` - Detailed repository guidelines, security tips, and Gemini API conventions
