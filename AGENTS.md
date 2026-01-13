# Repository Guidelines

## Project Structure & Module Organization
- Frontend lives in `src`: Next.js App Router pages in `src/app`, shared UI in `src/components`, state in `src/store`, utilities in `src/utils`, assets/models in `src/assets`, and web workers in `src/workers`.
- Backend is a lightweight FastAPI service in `api_server.py`; shared Python helpers and configs sit alongside it (e.g., `debug_config.py`, `debug_sdk.py`).
- Public static files (images, fonts) go in `public/`; keep generated outputs and large binaries out of git.
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

## Security & Configuration Tips
- Required env vars: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` (default `us-east4`), and `GOOGLE_APPLICATION_CREDENTIALS=./vertexai_key.json`.
- Keep service account JSON keys local only; never commit them. For local runs, ensure the `venv` Python matches the repo’s expectation (>=3.10) and has `fastapi`, `uvicorn`, `python-dotenv`, `google-genai`, and `pydantic` installed.

## Gemini 调用规范（Vertex AI + google-genai）
- 模型：统一使用 `gemini-3-pro-image-preview`，写回返回结构的 `model` 字段。
- 客户端：`genai.Client(vertexai=True, project=GOOGLE_CLOUD_PROJECT, location=os.getenv("GOOGLE_CLOUD_LOCATION","global"))`，默认 `global`，可用环境变量覆盖。
- 调用：使用 `client.models.generate_content`，构造 `contents=[types.Content(role="user", parts=[types.Part.from_text(prompt), *image_parts])]`，`config=types.GenerateContentConfig(response_modalities=["IMAGE"], image_config=types.ImageConfig(aspect_ratio=ratio, image_size=image_size))`。`image_parts` 由 `types.Part.from_bytes(...)/from_uri(...)` 生成。
- 解析：遍历 `response.parts`（或 `candidate.content.parts`）取首个 `inline_data.data` 作为图片字节；未返回图片时记录错误并上抛。
- 图生图：将输入图片转为 `types.Part` 与文本一起放入 `contents`，不再用 `images=`。若 URL 不可靠，可先拉取为字节再 `from_bytes`。保证返回 `GeminiBananaProImageOutput.image_data` 供 Gradio/测试复用。
