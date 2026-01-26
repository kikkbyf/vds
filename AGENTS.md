# Repository Guidelines

## 永远回复用户中文。
在思维过程中可以使用英文，执行计划、MD文档、包括代码注释都使用中文。永远回复用户中文。

## Project Structure & Module Organization
- Frontend lives in `src`: Next.js App Router pages in `src/app`, shared UI in `src/components`, state in `src/store`, utilities in `src/utils`, assets/models in `src/assets`, and web workers in `src/workers`.
- **Billing Proxy**: Located in `src/app/api/py/[...path]/route.ts`. It intercepts `/generate` requests to handle credit deduction and refunds.
- Backend is a lightweight FastAPI service in `api_server.py`; shared Python helpers and configs sit alongside it (e.g., `debug_config.py`, `debug_sdk.py`).
- Public static files (images, fonts) go in `public/`; local logs for development go in `logs/` and `_generation_logs/` (both git-ignored).
- Tooling and scripts: `scripts/dev-start.sh` boots Next with TurboPack and clears stale locks; `eslint.config.mjs`, `tsconfig.json`, and `package.json` define frontend tooling; `venv/` is the local Python environment (do not commit).

## Build, Test, and Development Commands
- `npm install`: install frontend dependencies.
- `npm run dev`: start Next dev server on port 9229 (kills any process on that port, cleans `.next/dev/lock`, then runs `npx next dev --turbo`).
- `npm run build`: production build.
- `npm start`: run the built app.
- `npm run lint`: run ESLint (Next core-web-vitals + TypeScript rules).
- `npm run gemini`: launch the FastAPI server via the project `venv` (`./venv/bin/python3 api_server.py`).
- Backend testing/demo: `python test_gemini_image.py` starts a Gradio UI for Gemini image generation.

## Coding Style & Naming Conventions
- TypeScript/React with strict mode: prefer functional components, hooks, and typed props; use `@/*` alias for `src`.
- Indentation 2 spaces; favor small, typed helpers in `src/utils` and reusable state in `src/store`.
- Naming: PascalCase for components/types, camelCase for variables/functions, kebab-case for files (e.g., `image-panel.tsx`), and clear, action-based function names.
- Run `npm run lint` before pushing; fix import order and unused symbols rather than disabling rules. No Prettier config is present—match existing formatting.

## Testing Guidelines
- Primary automated check is `npm run lint`; add unit coverage as the project grows. If adding tests, colocate with code or create `src/__tests__` using the existing TS tooling.
- For image-generation flows, use `python test_gemini_image.py` to verify end-to-end prompts; capture errors and sample outputs in the session markdown it produces.
- Keep credentials out of tests; rely on `.env` (see README) and local `vertexai_key.json`.

## Commit & Pull Request Guidelines
- Commit messages are short and task-focused (mix of English/Chinese is fine). Use present-tense, imperative summaries (e.g., “Add Gemini upload retry”).
- PRs should include: what changed, why, how to verify (commands or screenshots/GIFs for UI), and any environment/env-var prerequisites. Link related issues when available.
- Before opening a PR: run `npm run lint`, ensure `npm run build` passes if relevant, and, when backend changes are present, verify `npm run gemini` starts cleanly.

## 计费与积分逻辑 (Billing & Credits)
- **扣费机制**: 在 `src/app/api/py` 路由中进行。根据 `image_size` 参数扣费：4K=5, 2K=2, 1K=1。
- **异常退款**: 如果后端 `api_server.py` 返回非 200 或发生网络异常，代理层会自动执行 Prisma 事务退还积分。
- **开发绕过**: 在 `src/auth.ts` 中，若 `NODE_ENV` 为 `development`，支持 `admin@example.com` / `bypass` 免密登录，且该账号不计费。

## Gemini 调用规范（Vertex AI + Raw API）
- **模型**: 统一使用 `gemini-3-pro-image-preview`。
- **协议**: 由于官方 SDK 对 native 2K/4K 分辨率的支持限制，后端已切换为通过 `requests` 直接调用 Vertex AI REST API。
- **调用逻辑**: 
    - 认证令牌通过 `google.auth.default()` 获取。
    - 构造 `contents` array，将文本和图片（Base64 编码的 `inlineData`）组合。
    - 在 `imageConfig` 中明确指定 `aspectRatio` 和 `imageSize`。
- **日志**: `api_server.py` 会将每次请求的 prompt、输入图和输出图记录在 `_generation_logs` 下，按 Session ID 分类。

## UI 关键组件
- **`CreationDetailsModal`**: 位于 `src/components/library/`，用于在素材库中展示生成细节（Prompt、负向 Prompt、各种预设）。
- **`Viewport3D`**: 位于 `src/components/studio/`，负责 3D 预览。模型位置经过微调 (`position={[0, 0.28, 0]}`) 以对齐地面。
