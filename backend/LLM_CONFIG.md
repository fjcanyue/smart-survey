# LLM API 配置指南

本项目支持多种 LLM 提供商，包括 OpenAI 官方以及所有兼容 OpenAI API 格式的第三方厂商。

## 支持的 LLM 提供商

### 1. OpenAI 兼容 API（推荐）

所有使用 OpenAI Chat Completions API 格式的厂商都可以通过以下环境变量配置：

- `OPENAI_API_KEY` - API 密钥（必需）
- `OPENAI_BASE_URL` - API 基础 URL（可选，默认为 OpenAI 官方地址）
- `OPENAI_MODEL` - 模型名称（可选，默认为 gpt-3.5-turbo）

#### 支持的厂商示例

| 厂商 | BASE_URL | MODEL 示例 |
|------|----------|-----------|
| **OpenAI 官方** | https://api.openai.com/v1 | gpt-3.5-turbo, gpt-4, gpt-4-turbo |
| **DeepSeek** | https://api.deepseek.com/v1 | deepseek-chat, deepseek-coder |
| **智谱 AI (GLM)** | https://open.bigmodel.cn/api/paas/v4 | glm-4, glm-3-turbo |
| **通义千问 (Qwen)** | https://dashscope.aliyuncs.com/compatible-mode/v1 | qwen-turbo, qwen-plus, qwen-max |
| **Moonshot (月之暗面)** | https://api.moonshot.cn/v1 | moonshot-v1-8k, moonshot-v1-32k |
| **硅基流动** | https://api.siliconflow.cn/v1 | Qwen/Qwen2-7B-Instruct 等 |
| **零一万物** | https://api.lingyiwanwu.com/v1 | yi-large, yi-medium |

### 2. Google Gemini

- `GEMINI_API_KEY` - Gemini API 密钥

### 3. Anthropic Claude

- `CLAUDE_API_KEY` - Claude API 密钥

## 配置方法

### 本地开发环境

1. 在 `backend` 目录下创建 `.dev.vars` 文件：

```bash
cd backend
cp .dev.vars.example .dev.vars
```

2. 编辑 `.dev.vars` 文件，填入您的 API Key：

```bash
# 示例：使用 DeepSeek
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

3. 启动开发服务器：

```bash
npm run dev
```

### 生产环境部署

使用 `wrangler secret put` 命令设置环境变量：

```bash
# 设置 API Key
wrangler secret put OPENAI_API_KEY
# 输入您的 API Key 后按 Enter

# 设置自定义 BASE_URL（可选）
wrangler secret put OPENAI_BASE_URL
# 输入 BASE_URL 后按 Enter

# 设置自定义模型（可选）
wrangler secret put OPENAI_MODEL
# 输入模型名称后按 Enter
```

## 配置示例

### 示例 1: 使用 OpenAI 官方

```bash
# .dev.vars
OPENAI_API_KEY=sk-proj-xxxxxx
# 不需要设置 BASE_URL 和 MODEL，使用默认值
```

### 示例 2: 使用 DeepSeek

```bash
# .dev.vars
OPENAI_API_KEY=sk-xxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

### 示例 3: 使用智谱 AI

```bash
# .dev.vars
OPENAI_API_KEY=xxxxxx.xxxxxx
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
OPENAI_MODEL=glm-4
```

### 示例 4: 使用通义千问

```bash
# .dev.vars
OPENAI_API_KEY=sk-xxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-turbo
```

## 优先级

如果配置了多个 LLM 提供商，系统会按以下优先级选择：

1. OpenAI 兼容 API（如果配置了 `OPENAI_API_KEY`）
2. Google Gemini（如果配置了 `GEMINI_API_KEY`）
3. Anthropic Claude（如果配置了 `CLAUDE_API_KEY`）

## 故障转移

如果主 LLM 提供商调用失败，系统会自动尝试其他已配置的提供商。如果所有提供商都失败，系统将返回一个默认的问卷模板。

## 常见问题

### Q: 如何测试配置是否正确？

A: 启动后端服务后，可以使用以下命令测试：

```bash
curl -X POST http://localhost:8787/api/surveys/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "创建一个客户满意度调查问卷"}'
```

### Q: 为什么推荐使用 OpenAI 兼容 API？

A: 因为这种方式只需要配置 BASE_URL 和 MODEL，就可以支持几乎所有主流的国内外 LLM 厂商，配置简单且灵活。

### Q: 是否可以同时配置多个提供商？

A: 可以。系统会按优先级使用，并在失败时自动切换到备用提供商。

### Q: 如何获取各厂商的 API Key？

A: 请访问各厂商的官方网站申请：

- OpenAI: https://platform.openai.com/
- DeepSeek: https://platform.deepseek.com/
- 智谱 AI: https://open.bigmodel.cn/
- 通义千问: https://dashscope.aliyun.com/
- Moonshot: https://platform.moonshot.cn/

## 注意事项

1. **不要将 API Key 提交到版本控制系统**（`.dev.vars` 和 `.env` 已加入 .gitignore）
2. **生产环境请使用 `wrangler secret put` 而不是 `.dev.vars`**
3. **注意各厂商的 API 调用限制和费用**
4. **建议定期轮换 API Key 以保证安全**