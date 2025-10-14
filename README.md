# 🚀 智能问卷系统 (Smart Survey)

基于 SurveyJS 与大语言模型的轻量级在线问卷调查系统，支持自然语言生成问卷，零成本部署在 Cloudflare 生态系统上。

## ✨ 特性

- 🤖 **AI 问卷生成**：通过自然语言描述自动生成专业问卷
- 📝 **多种题型支持**：单选、多选、文本输入、评分、排序等
- 👤 **多平台社交登录**：支持 GitHub、Google、Microsoft 账号登录
- 🔐 **用户权限管理**：问卷创建者独享编辑权限
- 📋 **我的问卷管理**：统一管理所有创建的问卷
- 💰 **零成本部署**：基于 Cloudflare Pages + Workers + D1 免费套餐
- 🔄 **多 LLM 支持**：OpenAI GPT、Google Gemini、Anthropic Claude
- 📊 **实时数据分析**：问卷结果可视化展示
- 🎨 **美观界面**：基于 SurveyJS 的现代化 UI + Tailwind CSS
- ⚡ **边缘计算**：全球 CDN 加速，低延迟响应
- 🔒 **安全可靠**：JWT 会话管理、OAuth 认证、API 密钥安全存储

## 🏗️ 系统架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   用户浏览器    │    │ Cloudflare Pages │    │ External APIs   │
│                 │    │   (前端静态)     │    │                 │
│  React SPA      │◄──►│                  │    │   OpenAI GPT    │
│  - 问卷创建器   │    │  + AuthContext   │    │   Google Gemini │
│  - 问卷运行器   │    │  + 用户管理      │    │   Claude API    │
│  - 结果查看器   │    │  + Dashboard     │    │                 │
│  - 我的问卷     │    │                  │    │  OAuth Providers│
└─────────────────┘    └──────────────────┘    │  - GitHub       │
         │                       │              │  - Google       │
         │                       │              │  - Microsoft    │
         ▼                       ▼              └─────────────────┘
┌────────────────────────────────────────────────────────┬─────┐
│               Cloudflare Worker (后端 API)              │     │
│  - 路由处理    - OAuth 认证   - JWT 会话管理           │     │
│  - LLM 集成    - 权限控制     - 数据库操作             │     │
└───────────────────────────────┬────────────────────────┴─────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   Cloudflare D1     │
                    │    (SQL 数据库)     │
                    │  - surveys 表       │
                    │  - results 表       │
                    │  (含 owner_id)      │
                    └─────────────────────┘
```

## 🚀 快速开始

### 前置条件

- Node.js 18+
- Cloudflare 账户
- 至少一个 LLM API Key (OpenAI/Gemini/Claude)
- OAuth 应用凭据 (GitHub/Google/Microsoft，可选)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd smart-survey
```

### 2. 配置 OAuth（可选但推荐）

如需用户认证功能，请先配置 OAuth 应用：

**GitHub OAuth:**
- 访问 https://github.com/settings/developers 创建 OAuth App
- 回调 URL: `http://localhost:8787/api/auth/callback/github` (开发环境)

**Google OAuth:**
- 访问 https://console.cloud.google.com/apis/credentials
- 创建 OAuth 2.0 客户端 ID
- 回调 URL: `http://localhost:8787/api/auth/callback/google`

**Microsoft OAuth:**
- 访问 https://portal.azure.com 注册应用
- 回调 URL: `http://localhost:8787/api/auth/callback/microsoft`

详细配置说明请查看 [AUTH_SETUP.md](AUTH_SETUP.md)

### 3. 部署后端

```bash
cd backend

# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler login

# 创建数据库
npx wrangler d1 create smart-survey-db

# 更新 wrangler.toml 中的 database_id

# 设置 LLM API 密钥（选择一个）
npx wrangler secret put OPENAI_API_KEY     # OpenAI
npx wrangler secret put GEMINI_API_KEY     # Google Gemini
npx wrangler secret put CLAUDE_API_KEY     # Anthropic Claude

# 设置认证相关密钥（如果启用认证）
npx wrangler secret put JWT_SECRET
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put MICROSOFT_CLIENT_ID
npx wrangler secret put MICROSOFT_CLIENT_SECRET
npx wrangler secret put FRONTEND_URL
npx wrangler secret put APP_URL

# 部署 Worker
npx wrangler deploy
```

### 4. 部署前端

**手动部署**

```bash
cd frontend

# 安装依赖
npm install

# 配置 API URL
# 创建 .env 文件，设置 VITE_API_URL=<你的Worker URL>

# 构建前端
npm run build

# 部署到 Cloudflare Pages (或手动上传 build 目录)
npx wrangler pages deploy dist --project-name=your-project-name
```

**自动部署**

#### 1. 准备工作
- 确保你的代码托管在 GitHub 上
- Cloudflare Pages 项目已创建并连接到你的仓库

#### 2. 自动部署步骤

1. 构建设置配置
 - 在 Cloudflare Pages 控制台中，进入你的项目设置
 - 构建配置：
   - 构建命令: `npm run build`
   - 构建输出目录: `dist`
   - 根目录: `frontend`

2. 环境变量配置
 - 在 Cloudflare Pages 控制台的环境变量设置中添加：
 - VITE_API_URL: 你的后端 Worker URL (例如: https://your-worker.your-subdomain.workers.dev)

3. 部署
 - 推送代码到主分支或创建 Pull Request
 - Cloudflare Pages 会自动触发构建和部署
 - 部署完成后，你会收到通知和预览链接

#### 3. 验证部署
访问部署提供的预览链接，应该能看到你的智能问卷系统首页。


访问你的 Worker URL + `/api/test`，应该看到：
```json
{"message": "API is working"}
```

## 📚 API 文档

### 🔐 认证相关

#### 发起登录
```http
GET /api/auth/login/{provider}
```
- provider: `github` | `google` | `microsoft`
- 自动重定向到 OAuth 提供商

#### OAuth 回调（自动处理）
```http
GET /api/auth/callback/{provider}
```

#### 获取当前用户
```http
GET /api/auth/me
```
**响应：**
```json
{
  "authenticated": true,
  "user": {
    "userId": "github:12345678",
    "provider": "github",
    "email": "user@example.com",
    "name": "张三",
    "avatar": "https://..."
  }
}
```

#### 登出
```http
POST /api/auth/logout
```

### 📋 问卷管理

#### 获取我的问卷列表（需登录）
```http
GET /api/surveys/my?limit=50&offset=0
```
**响应：**
```json
{
  "surveys": [
    {
      "id": "survey_xxx",
      "title": "问卷标题",
      "created_at": "2024-01-01T00:00:00Z",
      "owner_id": "github:12345678"
    }
  ],
  "total": 10
}
```

### 🤖 生成问卷（需登录）
```http
POST /api/surveys/generate
Content-Type: application/json

{
  "prompt": "创建一个关于员工对公司食堂满意度的调查问卷"
}
```

**响应：**
```json
{
  "id": "survey_1234567890_abc123",
  "json": {
    "title": "员工食堂满意度调查",
    "pages": [...]
  }
}
```

### 💾 保存问卷（需登录）
```http
POST /api/surveys
Content-Type: application/json

{
  "id": "survey_1234567890_abc123",
  "json": { /* SurveyJS JSON */ },
  "themeType": "default"
}
```

### 📖 获取问卷
```http
GET /api/surveys/{survey_id}
```

### 📝 提交答案
```http
POST /api/results/{survey_id}
Content-Type: application/json

{
  "data": {
    "question1": "answer1",
    "question2": ["option1", "option2"]
  }
}
```

### 📊 获取结果
```http
GET /api/results/{survey_id}?limit=100&offset=0
```

## 🗂️ 项目结构

```
smart-survey/
├── README.md                    # 项目说明文档
├── DESIGN.md                   # 详细设计文档
├── ITERATION_PLAN.md           # 迭代开发计划
├── CLAUDE.md                   # Claude Code 指导文档
├── AUTH_SETUP.md               # 认证系统配置指南
├── LICENSE                     # MIT 许可证
├── backend/                    # 后端 Cloudflare Worker
│   ├── src/
│   │   ├── worker.js          # Worker 入口文件及路由
│   │   └── services/
│   │       ├── llm.js         # LLM API 集成
│   │       ├── database.js    # 数据库操作
│   │       └── auth.js        # OAuth 认证服务
│   ├── wrangler.toml          # Cloudflare 配置
│   ├── package.json
│   ├── .env.example           # 环境变量示例
│   └── .dev.vars              # 本地开发环境变量
└── frontend/                   # 前端 React 应用
    ├── src/
    │   ├── pages/             # 页面组件
    │   │   ├── HomePage.jsx
    │   │   ├── SurveyCreatorPage.jsx
    │   │   ├── SurveyRunnerPage.jsx
    │   │   ├── ResultsPage.jsx
    │   │   └── DashboardPage.jsx    # 我的问卷管理
    │   ├── contexts/
    │   │   └── AuthContext.jsx      # 认证状态管理
    │   ├── components/        # 通用组件
    │   │   └── ui/           # Shadcn UI 组件
    │   ├── lib/
    │   │   ├── api.js        # API 服务封装
    │   │   ├── utils.js
    │   │   └── surveyThemes.js
    │   └── hooks/            # 自定义 Hooks
    ├── package.json
    ├── .env.example
    └── public/
```

## 🎯 使用示例

### 用户认证

1. 访问首页，点击导航栏登录按钮
2. 选择登录方式（GitHub / Google / Microsoft）
3. 完成 OAuth 授权
4. 自动跳转回应用，登录成功

### 创建问卷

1. 登录后访问问卷创建页面
2. 输入自然语言描述：
   ```
   创建一个关于新员工培训效果的问卷，包括：
   - 培训内容满意度评分
   - 讲师表现评价
   - 培训时长是否合适
   - 开放性建议反馈
   ```
3. AI 自动生成专业问卷并自动关联当前用户
4. 可在 JSON 编辑器或可视化编辑器中进一步编辑
5. 保存并获得分享链接

### 管理问卷

1. 登录后点击"我的问卷"
2. 查看所有自己创建的问卷
3. 可以预览、复制链接、查看结果
4. 只有问卷创建者可以编辑问卷

### 填写问卷

1. 通过分享链接访问问卷（无需登录）
2. 填写各类题型（单选、多选、评分等）
3. 提交答案

### 查看结果

1. 访问结果页面
2. 查看数据概览和统计图表
3. 查看详细答卷内容

## 🔧 配置说明

### 环境变量

#### 后端 (Cloudflare Worker)

| 变量名 | 说明 | 必需 |
|--------|------|------|
| **LLM API（选择一个）** |
| `OPENAI_API_KEY` | OpenAI GPT API 密钥 | 选择一个 |
| `OPENAI_MODEL` | 使用的模型，如 gpt-4 | 可选 |
| `GEMINI_API_KEY` | Google Gemini API 密钥 | 选择一个 |
| `GEMINI_MODEL` | 使用的模型，如 gemini-pro | 可选 |
| `CLAUDE_API_KEY` | Anthropic Claude API 密钥 | 选择一个 |
| `CLAUDE_MODEL` | 使用的模型 | 可选 |
| **认证系统（可选）** |
| `JWT_SECRET` | JWT 令牌加密密钥 | 启用认证时必需 |
| `FRONTEND_URL` | 前端应用 URL | 启用认证时必需 |
| `APP_URL` | Worker URL | 启用认证时必需 |
| `GITHUB_CLIENT_ID` | GitHub OAuth 客户端 ID | 可选 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth 客户端密钥 | 可选 |
| `GOOGLE_CLIENT_ID` | Google OAuth 客户端 ID | 可选 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 客户端密钥 | 可选 |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth 客户端 ID | 可选 |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth 客户端密钥 | 可选 |

#### 前端

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_API_URL` | 后端 Worker URL | 是 |

### 数据库表结构

#### surveys 表
```sql
CREATE TABLE surveys (
    id TEXT PRIMARY KEY,
    title TEXT,
    json TEXT NOT NULL,
    theme_type TEXT DEFAULT 'default',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    owner_id TEXT  -- 用户 ID，格式: {provider}:{user_id}
);
```

#### results 表
```sql
CREATE TABLE results (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id)
);
```

## 💡 技术栈

### 前端
- **React 19** - 用户界面框架
- **React Router** - 客户端路由
- **SurveyJS** - 问卷核心库
  - `survey-react-ui` - 问卷渲染
  - `survey-creator-react` - 问卷编辑器
- **Tailwind CSS** - 样式框架
- **Shadcn UI** - UI 组件库
- **Frappe Charts** - 数据可视化
- **Vite** - 构建工具
- **Cloudflare Pages** - 静态网站托管

### 后端
- **Cloudflare Workers** - Serverless 计算
- **Cloudflare D1** - SQL 数据库
- **Arctic** - OAuth 2.0 客户端库
- **jose** - JWT 令牌管理
- **多 LLM 支持** - AI 问卷生成

### 认证
- **OAuth 2.0** - GitHub, Google, Microsoft 登录
- **JWT** - 会话令牌管理
- **HttpOnly Cookie** - 安全会话存储

### AI 模型
- **OpenAI GPT** - 主推选择
- **Google Gemini** - 备选方案
- **Anthropic Claude** - 备选方案

## 📈 成本分析

基于 Cloudflare 免费套餐：

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| Workers | 100,000 请求/天 | $0.50/百万请求 |
| Pages | 无限制 | 免费 |
| D1 数据库 | 25B 行读取 + 5M 行写入/月 | 按量计费 |
| **额外成本** | **LLM API 调用** | **按提供商计费** |

预估月成本：$0-10（主要是 LLM API 费用）

## 🔒 安全特性

- ✅ API 密钥安全存储在 Worker Secrets
- ✅ 输入验证和 XSS 防护
- ✅ CORS 跨域保护
- ✅ SQL 注入防护（参数化查询）
- ✅ 前后端分离架构

## 🚀 扩展功能

- [ ] 用户认证系统
- [ ] 问卷模板市场
- [ ] 高级数据分析
- [ ] Webhook 集成
- [ ] 多语言支持
- [ ] 移动端优化
- [ ] 批量导入/导出

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

- 📖 查看 [设计文档](DESIGN.md) 了解架构细节
- 🚀 查看 [部署指南](backend/DEPLOYMENT.md) 了解部署步骤
- 📋 查看 [迭代计划](ITERATION_PLAN.md) 了解开发进度
- 🐛 [提交 Issue](../../issues) 报告问题
- 💬 [发起讨论](../../discussions) 交流想法

## 🙏 致谢

- [SurveyJS](https://surveyjs.io/) - 强大的问卷核心库
- [Cloudflare](https://cloudflare.com/) - 优秀的边缘计算平台
- [OpenAI](https://openai.com/) - 先进的语言模型技术

---

**⭐ 如果这个项目对你有帮助，请给它一个 Star！**