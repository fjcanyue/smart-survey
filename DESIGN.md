## **项目：基于 SurveyJS 与大模型的轻型问卷系统设计文档**

**版本：** 1.0
**日期：** 2025年9月24日

### 1\. 项目概述

#### 1.1 项目简介

本项目旨在构建一个轻量级、易于部署且成本极低的在线问卷调查系统。系统将利用 **SurveyJS** 套件作为核心的问卷表单渲染和管理引擎，集成**大型语言模型 (LLM)** 实现自然语言自动化创建问卷，并采用 **Cloudflare** 的生态系统（包括 Pages, Workers, 和 D1/R2）进行免费部署和数据存储。

用户可以通过简单的自然语言描述（例如：“创建一个关于员工对食堂满意度的调查问卷”）快速生成专业的问卷表单，并将收集到的数据安全地存储在云端。

#### 1.2 设计目标

  * **智能化创建**：用户无需手动拖拽组件，通过自然语言指令即可由 AI 自动生成问卷的 JSON 结构。
  * **轻量化部署**：整个系统设计为静态前端 + Serverless 后端的架构，可以轻松部署在 Cloudflare 等免费或低成本的边缘计算平台上。
  * **零成本启动**：核心技术选型均围绕 Cloudflare 的免费套餐，包括网站托管、计算服务和数据存储，实现个人或小型团队的零成本运营。
  * **高可扩展性**：基于 SurveyJS 的模块化设计，未来可以方便地扩展自定义题型、逻辑流和数据分析功能。
  * **数据安全**：前后端分离，敏感操作（如调用 LLM API Key、数据库操作）均在后端 Worker 中完成，不暴露给客户端。

### 2\. 技术选型

| 模块 | 技术 | 理由 |
| :--- | :--- | :--- |
| **前端框架** | React / Vue | SurveyJS 对主流前端框架支持良好，提供官方组件库 (`survey-react-ui` / `survey-vue-ui`)，开发效率高。本项目以 **React** 为例。 |
| **问卷核心库** | SurveyJS | 功能强大且成熟的开源问卷库，支持 JSON 定义表单、动态逻辑、多主题样式和丰富的题型。其 `Survey Creator` 组件非常适合与 AI 生成的 JSON 结合。 |
| **前端托管** | Cloudflare Pages | 提供全球 CDN 加速的免费静态网站托管服务，与 Workers 无缝集成，支持自定义域名，非常适合部署 SPA 应用。 |
| **后端服务** | Cloudflare Workers | Serverless 计算平台，在边缘节点运行，延迟低。免费套餐额度充足，适合作为 API 网关、处理表单提交和与 LLM 及数据库交互。 |
| **问卷定义存储** | Cloudflare D1 | Cloudflare 的无服务器 SQL 数据库。适合存储结构化的问卷元数据和 JSON 定义。免费层级足够支撑中小型应用。 |
| **问卷结果存储** | Cloudflare D1 或 R2 | **方案A (主推): Cloudflare D1** - 结果直接存入 SQL 数据库，便于后续查询和分析。**方案B (备选): Cloudflare R2** - 对象存储，每次提交存为一个 JSON 文件。写入成本极低，适合海量数据，但分析相对复杂。本项目优先采用 D1 以简化架构。 |
| **AI 模型** | OpenAI GPT / Google Gemini / Anthropic Claude | 通过 API 调用。后端 Worker 将作为代理，封装对这些 LLM 的请求，避免在前端暴露 API Key。 |

### 3\. 系统架构

#### 3.1 架构图

```
+----------------+      +---------------------+      +---------------------+
|   用户浏览器    |      |  Cloudflare Network |      | External Services   |
+----------------+      +---------------------+      +---------------------+
|                |      |                     |      |                     |
|  React (SPA)   |----->| Cloudflare Pages    |      |                     |
| - Survey Creator |      |  (静态资源托管)     |      |                     |
| - Survey Runner  |      |                     |      |                     |
| - Results Viewer |      |                     |      |                     |
|                |      |                     |      |                     |
|       |        |      |                     |      |                     |
|       |        |      +---------------------+      |                     |
|       |        |                |                 |                     |
|       +--------------------->| Cloudflare Worker   |<--------------------+
|         (API 请求)      |  (Serverless后端)   | (LLM API Call)      |    LLM API          |
|                        |                     |                     | (e.g., OpenAI)      |
|                        |   - API 路由        |                     |                     |
|                        |   - 业务逻辑        |                     |                     |
|                        |   - LLM 代理        |                     |                     |
|                        |   - 数据库交互      |                     |                     |
|                        +---------+-----------+                     +---------------------+
|                                  |
|                                  | (SQL 查询/写入)
|                                  |
|                      +-----------v-----------+
|                      |    Cloudflare D1      |
|                      |  (Serverless SQL DB)  |
|                      | - `surveys` 表        |
|                      | - `results` 表        |
|                      +-----------------------+

```

#### 3.2 数据流

1.  **创建问卷**：

      * 用户在前端界面的输入框中输入自然语言描述（如：“创建一个 IT 部门的设备满意度调查”）。
      * 前端应用将该描述通过 API 请求发送到 Cloudflare Worker。
      * Worker 接收到请求后，构造一个包含特定指令（Prompt）的请求，调用外部 LLM API。
      * LLM 根据指令，生成符合 SurveyJS JSON 格式的问卷结构。
      * Worker 接收到 LLM 返回的 JSON，进行基本校验，然后将其存入 Cloudflare D1 的 `surveys` 表中，并返回问卷 ID 和 JSON 给前端。
      * 前端的 Survey Creator 组件加载并显示该 JSON，用户可以进行二次修改和保存。

2.  **填写问卷**：

      * 用户通过一个唯一的 URL (如 `https://<your-domain>/s/<survey_id>`) 访问问卷。
      * 前端应用根据 `survey_id` 向 Worker 请求问卷的 JSON 定义。
      * Worker 从 D1 数据库中查询并返回对应的问卷 JSON。
      * 前端的 Survey Runner 组件渲染问卷。
      * 用户填写完毕后，点击提交。
      * 前端将答题结果（一个 JSON 对象）发送到 Worker 的提交接口。
      * Worker 将答题结果存入 D1 的 `results` 表中，与 `survey_id` 关联。

3.  **查看结果**：

      * 问卷创建者访问结果页面 (如 `https://<your-domain>/results/<survey_id>`)。
      * 前端向 Worker 请求指定 `survey_id` 的所有答题结果。
      * Worker 从 D1 的 `results` 表中查询所有相关记录，并返回给前端。
      * 前端使用图表库（如 Chart.js）或 SurveyJS 自带的分析组件 (`survey-analytics`) 对数据进行可视化展示。

### 4\. 模块设计

#### 4.1 前端应用 (React SPA)

  * **页面/组件**：
      * `HomePage`：项目介绍，创建新问卷的入口。
      * `SurveyCreatorPage`：
          * 一个文本输入框用于提交自然语言需求。
          * 集成 `SurveyCreatorComponent`，用于显示和编辑 AI 生成的问卷 JSON。
          * 提供保存、预览和分享问卷的功能。
      * `SurveyRunnerPage`：
          * 动态加载路由参数中的 `survey_id`。
          * 集成 `Survey` 组件，用于渲染和运行问卷。
      * `ResultsPage`：
          * 展示答题数据的统计信息和原始数据列表。
          * 可以使用 `survey-analytics` 包或自定义图表。
  * **状态管理**：使用 React Context 或 Zustand 等轻量级状态管理库来管理全局状态（如用户信息、API 加载状态等）。

#### 4.2 后端服务 (Cloudflare Worker)

  * **API Endpoints**：
      * `POST /api/surveys/generate`：AI 生成问卷。
          * Request Body: `{ "prompt": "创建一个关于..." }`
          * Response Body: `{ "id": "...", "json": { ... } }`
      * `POST /api/surveys`：保存/更新问卷。
          * Request Body: `{ "id": "...", "json": { ... } }`
          * Response Body: `{ "success": true }`
      * `GET /api/surveys/:id`：获取指定问卷的 JSON 定义。
          * Response Body: `{ "json": { ... } }`
      * `POST /api/results/:surveyId`：提交问卷答案。
          * Request Body: `{ "data": { "question1": "answer1", ... } }`
          * Response Body: `{ "success": true }`
      * `GET /api/results/:surveyId`：获取指定问卷的所有答案。
          * Response Body: `[{ "id": "...", "data": { ... }, "createdAt": "..." }, ...]`

#### 4.3 数据存储 (Cloudflare D1)

  * **数据库 Schema**：
      * **`surveys` 表**：存储问卷的定义和元数据。
        ```sql
        CREATE TABLE surveys (
            id TEXT PRIMARY KEY,       -- 问卷唯一ID (e.g., UUID)
            title TEXT,                -- 问卷标题 (可以从JSON中提取)
            json TEXT NOT NULL,        -- SurveyJS 的 JSON 结构
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            owner_id TEXT              -- （可选）未来扩展多用户时使用
        );
        ```
      * **`results` 表**：存储用户的答题结果。
        ```sql
        CREATE TABLE results (
            id TEXT PRIMARY KEY,       -- 答题记录唯一ID
            survey_id TEXT NOT NULL,   -- 关联的问卷ID
            data TEXT NOT NULL,        -- 答题结果的 JSON 字符串
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (survey_id) REFERENCES surveys(id)
        );
        ```
      * **注意**：D1 目前对 JSON 类型的支持有限，因此将 JSON 直接存储为 `TEXT` 类型是最简单可靠的方式。在 Worker 中进行 `JSON.parse()` 和 `JSON.stringify()`。

#### 4.4 AI 问卷生成模块

  * **核心逻辑**：此模块的关键在于 **Prompt Engineering (提示词工程)**。
  * **实现方式**：在 Cloudflare Worker 中，创建一个函数 `generateSurveyFromPrompt(prompt: string)`。
  * **Prompt 示例**：
      * **System Prompt (系统指令)**：这个指令非常重要，用于规范 LLM 的行为。
        ```
        You are an expert in creating professional surveys. Your task is to generate a JSON object that strictly follows the SurveyJS JSON schema. Do not output any text, explanation, or markdown formatting before or after the JSON object. The entire output must be a single, valid JSON object.
        ```
      * **User Prompt (用户输入)**：
        ```
        Create a survey for customer satisfaction at a coffee shop. It should include questions about the quality of coffee, staff friendliness, store ambiance, and an open-ended feedback question.
        ```
  * **工作流程**：
    1.  将 System Prompt 和 User Prompt 组合成一个完整的请求。
    2.  通过 `fetch` 调用 LLM 的 API (例如 OpenAI 的 `v1/chat/completions`)。
    3.  在 Worker 的环境变量中安全地存储 LLM 的 `API_KEY`。
    4.  接收 LLM 返回的文本，并尝试 `JSON.parse()`。如果解析失败，可以进行重试或返回错误。

### 5\. 部署方案

1.  **初始化项目**：
      * 使用 `create-react-app` 或 `Vite` 创建前端项目。
      * 使用 Cloudflare 的 `wrangler` CLI 初始化 Worker 项目。
2.  **前端部署**：
      * 将前端 React 项目关联到 Cloudflare Pages。
      * 设置构建命令 (`npm run build`) 和输出目录 (`build` 或 `dist`)。
      * Cloudflare Pages 会在代码推送到 Git 仓库时自动构建和部署。
3.  **后端部署**：
      * 在 Worker 代码中编写 API 逻辑。
      * 使用 `wrangler` 命令行工具：
          * `wrangler d1 create <DB_NAME>` 创建数据库。
          * 在 `wrangler.toml` 文件中配置 D1 数据库绑定。
          * `wrangler secret put <SECRET_NAME>` 设置 LLM 的 API Key。
          * `wrangler deploy` 将 Worker 部署到 Cloudflare 网络。
4.  **域名和路由**：
      * 将自定义域名指向 Cloudflare Pages。
      * 配置路由，使所有 `/api/*` 的请求都由 Pages 函数（即部署的 Worker）处理，实现前后端统一域名。

### 6\. 安全性考虑

  * **API 密钥管理**：LLM API Key 必须存储在 Cloudflare Worker 的 Secrets 中，绝不能暴露在前端代码里。
  * **输入验证**：所有来自客户端的输入（尤其是提交的问卷结果）都应在 Worker 端进行验证和清理，防止注入攻击。
  * **速率限制**：可以为调用 LLM 的 API 端点设置速率限制，防止滥用和不必要的开销。Cloudflare Workers 提供了实现速率限制的工具。
  * **CORS**：正确配置 Worker 的 CORS 策略，确保只有您的前端域名可以访问 API。

### 7\. 扩展性与未来展望

  * **用户认证**：集成 Cloudflare Access 或第三方认证服务（如 Auth0），实现多用户问卷管理。
  * **高级数据分析**：在结果展示页面引入更复杂的图表和数据下钻功能。
  * **模板市场**：创建一个问卷模板库，用户可以直接从模板创建问卷。
  * **Webhook 集成**：当有新问卷提交时，通过 Webhook 通知到其他服务（如 Slack, Google Sheets）。
  * **R2 存储优化**：对于需要收集大量问卷（百万级）的场景，可以切换到 R2 存储答题结果，并配合 Cloudflare Workers Analytics Engine 进行异步分析，以降低成本和提高写入性能。

