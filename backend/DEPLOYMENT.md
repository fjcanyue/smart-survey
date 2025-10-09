# 智能问卷系统 - 后端部署指南

## 前置条件

1. 安装 Node.js (推荐 18.x 或更高版本)
2. 安装 Wrangler CLI: `npm install -g wrangler`
3. 拥有 Cloudflare 账户
4. 拥有至少一个 LLM API Key (OpenAI, Google Gemini, 或 Anthropic Claude)

## 部署步骤

### 1. 认证 Cloudflare

```bash
wrangler auth login
```

### 2. 创建 D1 数据库

```bash
cd backend
wrangler d1 create smart-survey-db
```

记录返回的 database_id，并更新 `wrangler.toml` 文件中的 `database_id` 字段。

### 3. 设置 API 密钥

选择并设置至少一个 LLM API Key：

#### OpenAI (推荐)
```bash
wrangler secret put OPENAI_API_KEY
# 输入你的 OpenAI API Key
```

#### Google Gemini
```bash
wrangler secret put GEMINI_API_KEY
# 输入你的 Google Gemini API Key
```

#### Anthropic Claude
```bash
wrangler secret put CLAUDE_API_KEY
# 输入你的 Anthropic Claude API Key
```

### 4. 部署 Worker

```bash
wrangler deploy
```

### 5. 验证部署

部署完成后，访问返回的 Worker URL，在路径后添加 `/api/test`，应该会看到：

```json
{"message": "API is working"}
```

## API 接口说明

### 生成问卷
- **POST** `/api/surveys/generate`
- **Body**: `{"prompt": "创建一个关于员工满意度的调查问卷"}`

### 保存问卷
- **POST** `/api/surveys`
- **Body**: `{"id": "survey_id", "json": {...}}`

### 获取问卷
- **GET** `/api/surveys/{survey_id}`

### 提交问卷结果
- **POST** `/api/results/{survey_id}`
- **Body**: `{"data": {"question1": "answer1", ...}}`

### 获取问卷结果
- **GET** `/api/results/{survey_id}`
- **Query Params**: `?limit=100&offset=0`

## 环境变量

### 可用的密钥 (Secrets)
- `OPENAI_API_KEY`: OpenAI GPT API 密钥
- `GEMINI_API_KEY`: Google Gemini API 密钥
- `CLAUDE_API_KEY`: Anthropic Claude API 密钥

### 数据库绑定
- `env.DB`: Cloudflare D1 数据库实例

## 故障排除

### 1. 数据库连接问题
确保 `wrangler.toml` 中的 `database_id` 正确设置。

### 2. LLM API 调用失败
检查 API Key 是否正确设置：
```bash
wrangler secret list
```

### 3. CORS 问题
确保前端域名在 Worker 的 CORS 配置中。当前配置允许所有域名 (`*`)。

## 开发模式

在本地运行开发服务器：

```bash
wrangler dev
```

这将在本地启动开发服务器，通常在 `http://localhost:8787`。

## 日志查看

查看 Worker 的运行日志：

```bash
wrangler tail
```

## 数据库管理

### 查看数据库内容
```bash
wrangler d1 execute smart-survey-db --command "SELECT * FROM surveys LIMIT 10"
wrangler d1 execute smart-survey-db --command "SELECT * FROM results LIMIT 10"
```

### 重置数据库（谨慎使用）
```bash
wrangler d1 execute smart-survey-db --command "DROP TABLE IF EXISTS results"
wrangler d1 execute smart-survey-db --command "DROP TABLE IF EXISTS surveys"
```

重新部署 Worker 后，表会自动重新创建。

## 成本估算

基于 Cloudflare 免费套餐：
- Workers: 100,000 次请求/天 (免费)
- D1: 25 亿行读取 + 5 百万行写入/月 (免费)
- 额外费用仅来自 LLM API 调用

## 安全建议

1. 定期轮换 API Keys
2. 监控 API 使用量，避免意外大量消费
3. 考虑为生产环境设置速率限制
4. 定期备份重要的问卷数据