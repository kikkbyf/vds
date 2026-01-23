# 项目环境与配置指南

## 📋 项目概况 (Project Overview)
- **架构**: Next.js (Frontend) + Next.js Proxy/Billing Layer + Python FastAPI (Backend)
- **核心功能**: Google Vertex AI (Gemini/Imagen) 图像生成、计费系统、作品集管理
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
  # 1. 创建虚拟环境
  python3 -m venv venv
  
  # 2. 激活环境 (Mac/Linux)
  source venv/bin/activate
  # Windows: .\venv\Scripts\activate
  
  # 3. 安装依赖 (使用 requirements.txt 确保版本一致)
  pip install -r requirements.txt
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

# [必填] NextAuth 密钥
AUTH_SECRET=your-random-secret
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

## 🔌 API 调用规范
所有图像生成请求应通过 Next.js 的 Proxy 层进行，以触发计费逻辑：
- **URL**: `http://127.0.0.1:9229/api/py/generate` (由前端代理到 8000 端口)
- **计费标准**: 4K=5积分, 2K=2积分, 1K=1积分
- **退款机制**: 若后端生成失败或网络超时，积分会自动退还到用户账户。

## 👤 用户流程 (User Flow)
1. **登录**: 
   - 支持开发模式快速进入 (`admin@example.com` / `bypass`)。
2. **AI 工作室 (Studio)**:
   - 上传参考图并选择画质（1K/2K/4K）。
   - 点击生成，系统实时扣除对应积分。
3. **作品库 (Library)**:
   - 查看所有已生成作品。
   - 点击作品卡片可弹出详情框，查看详细的 Prompt 和生成参数。
4. **管理面板**:
   - 管理员可查看用户信息、积分余额及计费流水。

## 📂 本地开发数据结构 (Local Development Data)
在本地开发模式下，生成的图像和元数据会保存在 `_generation_logs` 目录中，用于替代云端数据库记录。

### 目录结构
```text
_generation_logs/
├── {SESSION_TIMESTAMP}/           # 启动会话 (如 2026-01-24_10-00-00)
│   ├── {TRANSACTION_ID}/          # 单次生成记录
│   │   ├── prompt.json            # [UTF-8] 原始提示词与参数
│   │   ├── persona.json           # [UTF-8] 角色配置 (仅限 Persona 模式)
│   │   ├── input_0.png            # 输入参考图 (如有)
│   │   └── output.png             # 最终生成结果
```

### 关键文件说明
- **prompt.json**: 包含完整的生成参数（Seed, Guidance, Prompt）。为防止中文乱码，系统强制使用 `ensure_ascii=False` 保存。
- **output.png**: 原始生成的 PNG 图片，Web 界面通过读取此文件进行展示。
