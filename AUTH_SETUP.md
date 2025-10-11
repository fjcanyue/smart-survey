# 认证系统配置指南

本项目已集成多平台社交账号登录功能，支持 GitHub、Google、Microsoft 和 X (Twitter) 登录。

## 功能特性

- ✅ 多平台 OAuth 登录（GitHub, Google, Microsoft）
- ✅ 无需独立用户数据库
- ✅ 统一的用户 ID 生成规则
- ✅ 问卷与用户关联
- ✅ 用户问卷管理（查看自己创建的问卷）
- ✅ 问卷权限控制（只有创建者可以编辑）

## 用户 ID 生成规则

系统根据不同登录源自动生成唯一用户 ID，格式为：`{provider}:{provider_user_id}`

示例：
- GitHub 用户: `github:12345678`
- Google 用户: `google:109876543210`
- Microsoft 用户: `microsoft:a1b2c3d4-e5f6-7890`

## 配置步骤

### 1. 后端配置 (Cloudflare Worker)

#### 1.1 创建 OAuth 应用

**GitHub OAuth:**
1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写应用信息：
   - Application name: `Smart Survey`
   - Homepage URL: `http://localhost:5173` (开发) 或您的生产域名
   - Authorization callback URL: `http://localhost:8787/api/auth/callback/github` (开发环境)
4. 获取 Client ID 和 Client Secret

**Google OAuth:**
1. 访问 https://console.cloud.google.com/apis/credentials
2. 创建 OAuth 2.0 客户端 ID
3. 应用类型选择 "Web application"
4. 授权重定向 URI: `http://localhost:8787/api/auth/callback/google`
5. 获取 Client ID 和 Client Secret

**Microsoft OAuth:**
1. 访问 https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. 注册新应用程序
3. 重定向 URI: `http://localhost:8787/api/auth/callback/microsoft`
4. 获取 Application (client) ID 和 Client Secret

#### 1.2 配置环境变量

在 Cloudflare Workers 中设置以下 secrets（生产环境）：

\`\`\`bash
# 设置 JWT Secret
wrangler secret put JWT_SECRET

# 设置 GitHub OAuth
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# 设置 Google OAuth
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# 设置 Microsoft OAuth
wrangler secret put MICROSOFT_CLIENT_ID
wrangler secret put MICROSOFT_CLIENT_SECRET

# 设置前端 URL
wrangler secret put FRONTEND_URL
wrangler secret put APP_URL
\`\`\`

**开发环境配置：**

复制 \`backend/.env.example\` 为 \`backend/.dev.vars\` 并填入实际值：

\`\`\`env
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:8787

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
\`\`\`

### 2. 前端配置

确保 \`frontend/.env\` 文件配置正确：

\`\`\`env
# 开发环境
VITE_API_URL=http://localhost:8787

# 生产环境
# VITE_API_URL=https://your-worker.your-subdomain.workers.dev
\`\`\`

### 3. 数据库配置

数据库已自动包含用户 ID 字段，无需额外配置。\`surveys\` 表结构：

\`\`\`sql
CREATE TABLE surveys (
  id TEXT PRIMARY KEY,
  title TEXT,
  json TEXT NOT NULL,
  theme_type TEXT DEFAULT 'default',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  owner_id TEXT  -- 存储用户 ID
);
\`\`\`

## API 端点

### 认证相关

- **\`GET /api/auth/login/{provider}\`** - 发起 OAuth 登录
  - provider: github | google | microsoft

- **\`GET /api/auth/callback/{provider}\`** - OAuth 回调处理

- **\`POST /api/auth/logout\`** - 登出

- **\`GET /api/auth/me\`** - 获取当前用户信息

### 问卷相关

- **\`GET /api/surveys/my\`** - 获取当前用户的问卷列表（需要登录）

- **\`POST /api/surveys/generate\`** - AI 生成问卷（需要登录）

- **\`POST /api/surveys\`** - 保存/更新问卷（需要登录）

- **\`GET /api/surveys/{id}\`** - 获取问卷（公开访问）

- **\`POST /api/results/{id}\`** - 提交问卷答案（公开访问）

- **\`GET /api/results/{id}\`** - 获取问卷结果（公开访问）

## 使用流程

### 1. 用户登录

1. 用户访问前端应用
2. 点击登录按钮（GitHub / Google / Microsoft）
3. 跳转到对应平台进行授权
4. 授权成功后重定向回应用，自动登录

### 2. 创建问卷

1. 登录后访问"创建问卷"页面
2. 输入问卷描述，AI 生成问卷
3. 编辑并保存问卷
4. 问卷自动关联当前用户 ID

### 3. 管理问卷

1. 登录后访问"我的问卷"页面
2. 查看所有自己创建的问卷
3. 可以预览、分享或查看结果
4. 只有创建者可以编辑自己的问卷

## 前端组件

### AuthContext

提供全局认证状态和方法：

\`\`\`jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, authenticated, login, logout } = useAuth();

  if (authenticated) {
    return <div>欢迎 {user.name}</div>;
  }

  return <button onClick={() => login('github')}>登录</button>;
}
\`\`\`

### 受保护的页面

使用认证检查保护页面：

\`\`\`jsx
function ProtectedPage() {
  const { authenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authenticated) {
      navigate('/');
    }
  }, [authenticated, loading]);

  // 页面内容
}
\`\`\`

## 注意事项

1. **生产环境回调 URL**: 部署到生产环境时，需要在各 OAuth 平台更新回调 URL
2. **CORS 配置**: 确保后端正确配置 CORS，允许前端域名访问
3. **JWT Secret**: 使用强随机字符串作为 JWT_SECRET
4. **Cookie 配置**: 生产环境需要使用 HTTPS 才能正确设置 Secure Cookie

## 故障排查

### 登录失败

1. 检查 OAuth 应用配置是否正确
2. 确认回调 URL 配置正确
3. 查看浏览器控制台和后端日志

### 无法保存问卷

1. 确认用户已登录
2. 检查 JWT token 是否有效
3. 查看后端返回的错误信息

### 看不到问卷列表

1. 确认问卷已正确保存并关联用户 ID
2. 检查数据库 \`owner_id\` 字段
3. 查看 API 返回的数据

## 开发测试

### 本地测试

\`\`\`bash
# 启动后端
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
\`\`\`

访问 http://localhost:5173，点击登录按钮测试登录流程。

### 测试用户管理

1. 使用不同账号登录
2. 创建问卷
3. 访问"我的问卷"查看列表
4. 尝试编辑其他用户的问卷（应该失败）
