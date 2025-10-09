# 🚀 智能问卷系统 (Smart Survey)

基于 SurveyJS 与大语言模型的轻量级在线问卷调查系统，支持自然语言生成问卷，零成本部署在 Cloudflare 生态系统上。

## ✨ 特性

- 🤖 **AI 问卷生成**：通过自然语言描述自动生成专业问卷
- 📝 **多种题型支持**：单选、多选、文本输入、评分、排序等
- 💰 **零成本部署**：基于 Cloudflare Pages + Workers + D1 免费套餐
- 🔄 **多 LLM 支持**：OpenAI GPT、Google Gemini、Anthropic Claude
- 📊 **实时数据分析**：问卷结果可视化展示
- 🎨 **美观界面**：基于 SurveyJS 的现代化 UI
- ⚡ **边缘计算**：全球 CDN 加速，低延迟响应
- 🔒 **安全可靠**：API 密钥安全管理，输入验证

## 🏗️ 系统架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   用户浏览器    │    │ Cloudflare Pages │    │ External APIs   │
│                 │    │   (前端静态)     │    │                 │
│  React SPA      │◄──►│                  │    │   OpenAI GPT    │
│  - 问卷创建器   │    │                  │    │   Google Gemini │
│  - 问卷运行器   │    │                  │    │   Claude API    │
│  - 结果查看器   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       ▲
         │                       │                       │
         ▼                       ▼                       │
┌────────────────────────────────────────────────────────┴─────┐
│               Cloudflare Worker (后端 API)                   │
│  - 路由处理    - LLM 集成    - 数据库操作    - 业务逻辑      │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   Cloudflare D1     │
                    │    (SQL 数据库)     │
                    │  - surveys 表       │
                    │  - results 表       │
                    └─────────────────────┘
```

## 🚀 快速开始

### 前置条件

- Node.js 18+
- Cloudflare 账户
- 至少一个 LLM API Key (OpenAI/Gemini/Claude)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd smart-survey
```

### 2. 部署后端

```bash
cd backend

# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler auth login

# 创建数据库
npx wrangler d1 create smart-survey-db

# 更新 wrangler.toml 中的 database_id

# 设置 API 密钥（选择一个）
npx wrangler secret put OPENAI_API_KEY     # OpenAI
npx wrangler secret put GEMINI_API_KEY     # Google Gemini
npx wrangler secret put CLAUDE_API_KEY     # Anthropic Claude

# 部署 Worker
npx wrangler deploy
```

### 3. 部署前端

```bash
cd frontend

# 安装依赖
npm install

# 更新 API 基础 URL 配置
# 编辑 src/config.js，设置后端 Worker URL

# 构建前端
npm run build

# 部署到 Cloudflare Pages (或手动上传 build 目录)
```

### 4. 验证部署

访问你的 Worker URL + `/api/test`，应该看到：
```json
{"message": "API is working"}
```

## 📚 API 文档

### 🤖 生成问卷
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

### 💾 保存问卷
```http
POST /api/surveys
Content-Type: application/json

{
  "id": "survey_1234567890_abc123",
  "json": { /* SurveyJS JSON */ }
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
├── backend/                    # 后端 Cloudflare Worker
│   ├── src/
│   │   ├── worker.js          # Worker 入口文件
│   │   ├── services/
│   │   │   ├── llm.js         # LLM API 集成
│   │   │   └── database.js    # 数据库操作
│   ├── wrangler.toml          # Cloudflare 配置
│   ├── package.json
│   └── DEPLOYMENT.md          # 部署指南
└── frontend/                   # 前端 React 应用
    ├── src/
    │   ├── pages/             # 页面组件
    │   ├── components/        # 通用组件
    │   └── services/          # API 服务
    ├── package.json
    └── public/
```

## 🎯 使用示例

### 创建问卷

1. 访问问卷创建页面
2. 输入自然语言描述：
   ```
   创建一个关于新员工培训效果的问卷，包括：
   - 培训内容满意度评分
   - 讲师表现评价
   - 培训时长是否合适
   - 开放性建议反馈
   ```
3. AI 自动生成专业问卷
4. 可进一步编辑和自定义
5. 保存并获得分享链接

### 填写问卷

1. 通过分享链接访问问卷
2. 填写各类题型（单选、多选、评分等）
3. 提交答案

### 查看结果

1. 访问结果页面
2. 查看统计图表
3. 下载原始数据

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI GPT API 密钥 | 选择一个 |
| `GEMINI_API_KEY` | Google Gemini API 密钥 | 选择一个 |
| `CLAUDE_API_KEY` | Anthropic Claude API 密钥 | 选择一个 |

### 数据库表结构

#### surveys 表
```sql
CREATE TABLE surveys (
    id TEXT PRIMARY KEY,
    title TEXT,
    json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    owner_id TEXT
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
- **React** - 用户界面框架
- **SurveyJS** - 问卷核心库
  - `survey-react-ui` - 问卷渲染
  - `survey-creator` - 问卷编辑器
  - `survey-analytics` - 结果分析
- **Cloudflare Pages** - 静态网站托管

### 后端
- **Cloudflare Workers** - Serverless 计算
- **Cloudflare D1** - SQL 数据库
- **多 LLM 支持** - AI 问卷生成

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