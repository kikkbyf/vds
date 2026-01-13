# 项目环境与配置指南

## 📋 项目概况 (Project Overview)
- **架构**: Next.js (Frontend) + Python FastAPI (Backend)
- **核心功能**: Google Vertex AI (Gemini/Imagen) 图像生成
- **位置**: 本地桌面 `/Users/edy/Documents/fasionphotoeditor`

## 🛠️ 环境依赖 (Dependencies)

### 1. 前端 (Frontend)
- **Node.js**: 推荐 v20.x 或更高
- **核心库**:
  - `next`: 16.1.1
  - `react`: 19.2.3
  - `three`: ^0.182.0
  - `@imgly/background-removal`: ^1.7.0
- **安装**:
  ```bash
  npm install
  ```

### 2. 后端 (Backend)
- **Python**: 推荐 v3.10 或更高
- **虚拟环境**: 建议使用 `venv`
- **核心库**:
  - `fastapi`
  - `uvicorn`
  - `python-dotenv`
  - `google-genai` (Google Official GenAI SDK)
- **安装**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  pip install fastapi uvicorn python-dotenv google-genai pydantic
  ```

## 🔑 环境变量 (.env)
请在项目根目录创建 `.env` 文件，并填入以下内容：

```properties
# [必填] Google Cloud Project ID
GOOGLE_CLOUD_PROJECT=your-project-id

# [选填] Vertex AI Region (默认 us-east4)
GOOGLE_CLOUD_LOCATION=us-east4

# [必填] 认证 Key 路径
# 指向根目录下的 JSON 密钥文件
GOOGLE_APPLICATION_CREDENTIALS=./vertexai_key.json
```

**注意**: 项目根目录必须包含 `vertexai_key.json` 文件（Google Service Account Key）。

## 🚀 启动指令 (Commands)

### 启动后端 (Port 8000)
```bash
npm run gemini
# 等同于: ./venv/bin/python3 api_server.py
```

### 启动前端 (Port 9229)
```bash
npm run dev
# 等同于: ./scripts/dev-start.sh (开启 Turbopack)
```

## 🔌 API 调用示例
前端硬编码调用本地接口:
- **URL**: `http://127.0.0.1:8000/generate`
- **Method**: `POST`
