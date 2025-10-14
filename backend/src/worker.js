import { generateSurveyFromPrompt, validateSurveyJson } from './services/llm.js';
import {
  initializeDatabase,
  saveSurvey,
  getSurvey,
  saveResult,
  getResults,
  validateDatabase,
  listSurveys
} from './services/database.js';
import {
  initializeOAuthClients,
  getAuthorizationUrl,
  handleOAuthCallback,
  createSessionToken,
  getUserFromRequest,
  generateState,
  setSessionCookie,
  clearSessionCookie
} from './services/auth.js';

// Cloudflare Worker entry point
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 初始化数据库（仅在需要时）
    if (env.DB) {
      try {
        await initializeDatabase(env.DB);
      } catch (error) {
        console.error('数据库初始化失败:', error);
        // 不阻塞请求，但记录错误
      }
    }

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    // Route handling
    if (url.pathname === "/api/test") {
      return new Response(JSON.stringify({ message: "API is working" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ========== 认证相关路由 ==========

    // 登录 - 重定向到 OAuth 提供商
    if (url.pathname.startsWith("/api/auth/login/") && request.method === "GET") {
      const provider = url.pathname.split("/")[4];
      return handleLogin(request, env, provider);
    }

    // OAuth 回调
    if (url.pathname.startsWith("/api/auth/callback/") && request.method === "GET") {
      const provider = url.pathname.split("/")[4];
      return handleCallback(request, env, provider);
    }

    // 登出
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return handleLogout(request, env);
    }

    // 获取当前用户信息
    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      return handleGetCurrentUser(request, env);
    }

    // 获取用户的问卷列表
    if (url.pathname === "/api/surveys/my" && request.method === "GET") {
      return handleGetMySurveys(request, env, ctx);
    }

    // ========== 问卷相关路由 ==========

    // AI 生成问卷
    if (url.pathname === "/api/surveys/generate" && request.method === "POST") {
      return handleGenerateSurvey(request, env, ctx);
    }

    // 保存/更新问卷
    if (url.pathname === "/api/surveys" && request.method === "POST") {
      return handleSaveSurvey(request, env, ctx);
    }

    // 获取指定问卷
    if (url.pathname.startsWith("/api/surveys/") && request.method === "GET") {
      const surveyId = url.pathname.split("/")[3];
      return handleGetSurvey(request, env, ctx, surveyId);
    }

    // 提交问卷答案
    if (url.pathname.startsWith("/api/results/") && request.method === "POST") {
      const surveyId = url.pathname.split("/")[3];
      return handleSubmitResult(request, env, ctx, surveyId);
    }

    // 获取问卷答案
    if (url.pathname.startsWith("/api/results/") && request.method === "GET") {
      const surveyId = url.pathname.split("/")[3];
      return handleGetResults(request, env, ctx, surveyId);
    }

    return new Response("Smart Survey Backend is running!");
  }
};

function handleOptions(request) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

/**
 * 获取 CORS 响应头
 */
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
  };
}

async function handleGenerateSurvey(request, env, ctx) {
  try {
    // 检查用户是否已登录
    const user = await getUserFromRequest(request, env.JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ error: "未登录，请先登录" }), {
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(request)
        },
        status: 401
      });
    }

    const { prompt } = await request.json();

    if (!prompt || prompt.trim() === '') {
      return new Response(JSON.stringify({ error: "缺少问卷描述" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // 调用 LLM API 生成问卷
    console.log(`用户 ${user.userId} 开始生成问卷，输入: ${prompt}`);
    const surveyJson = await generateSurveyFromPrompt(prompt, env);

    // 验证生成的问卷
    const validation = validateSurveyJson(surveyJson);
    if (!validation.valid) {
      console.error('生成的问卷验证失败:', validation.error);
      return new Response(JSON.stringify({ error: `生成的问卷格式不正确: ${validation.error}` }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 生成唯一的问卷 ID
    const surveyId = generateSurveyId();

    // 如果配置了数据库，自动保存生成的问卷，并关联用户
    if (env.DB) {
      try {
        await saveSurvey(env.DB, surveyId, surveyJson, null, 'default', user.userId);
        console.log(`问卷已自动保存到数据库，ID: ${surveyId}, Owner: ${user.userId}`);
      } catch (dbError) {
        console.error('自动保存问卷到数据库失败:', dbError);
        // 不阻塞响应，只记录错误
      }
    }

    const response = {
      id: surveyId,
      json: surveyJson
    };

    console.log(`问卷生成成功，ID: ${surveyId}`);
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('生成问卷时发生错误:', error);
    return new Response(JSON.stringify({
      error: "生成问卷失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      },
      status: 500
    });
  }
}

// 生成唯一的问卷 ID
function generateSurveyId() {
  return 'survey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function handleSaveSurvey(request, env, ctx) {
  try {
    // 检查用户是否已登录
    const user = await getUserFromRequest(request, env.JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ error: "未登录，请先登录" }), {
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(request)
        },
        status: 401
      });
    }

    const { id, json, themeType } = await request.json();

    if (!id || !json) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID 或 JSON 数据" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // 验证问卷 JSON 格式
    const validation = validateSurveyJson(json);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: `问卷 JSON 格式不正确: ${validation.error}`
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 检查问卷是否已存在，如果存在则验证所有权
    const existingSurvey = await getSurvey(env.DB, id);
    if (existingSurvey && existingSurvey.ownerId && existingSurvey.ownerId !== user.userId) {
      return new Response(JSON.stringify({ error: "无权限修改此问卷" }), {
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(request)
        },
        status: 403
      });
    }

    // 保存问卷到数据库，包含主题类型和用户 ID
    await saveSurvey(env.DB, id, json, null, themeType || 'default', user.userId);

    return new Response(JSON.stringify({ success: true, id }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('保存问卷时发生错误:', error);
    return new Response(JSON.stringify({
      error: "保存问卷失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      },
      status: 500
    });
  }
}

async function handleGetSurvey(request, env, ctx, surveyId) {
  try {
    if (!surveyId) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 从数据库获取问卷
    const survey = await getSurvey(env.DB, surveyId);

    if (!survey) {
      return new Response(JSON.stringify({ error: "问卷不存在" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }

    return new Response(JSON.stringify({
      json: survey.json,
      title: survey.title,
      themeType: survey.themeType,
      createdAt: survey.createdAt
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('获取问卷时发生错误:', error);
    return new Response(JSON.stringify({
      error: "获取问卷失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      },
      status: 500
    });
  }
}

async function handleSubmitResult(request, env, ctx, surveyId) {
  try {
    const { data } = await request.json();

    if (!surveyId) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: "缺少或无效的问卷答案数据" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 验证问卷是否存在
    const survey = await getSurvey(env.DB, surveyId);
    if (!survey) {
      return new Response(JSON.stringify({ error: "问卷不存在" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }

    // 保存问卷结果到数据库
    const result = await saveResult(env.DB, surveyId, data);

    return new Response(JSON.stringify({
      success: true,
      resultId: result.id
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('提交问卷结果时发生错误:', error);
    return new Response(JSON.stringify({
      error: "提交问卷结果失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      },
      status: 500
    });
  }
}

async function handleGetResults(request, env, ctx, surveyId) {
  try {
    if (!surveyId) {
      return new Response(JSON.stringify({ error: "缺少问卷 ID" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 验证问卷是否存在
    const survey = await getSurvey(env.DB, surveyId);
    if (!survey) {
      return new Response(JSON.stringify({ error: "问卷不存在" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }

    // 从 URL 查询参数获取分页信息
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // 从数据库获取问卷结果
    const results = await getResults(env.DB, surveyId, limit, offset);

    return new Response(JSON.stringify({
      results,
      surveyTitle: survey.title,
      total: results.length,
      limit,
      offset
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('获取问卷结果时发生错误:', error);
    return new Response(JSON.stringify({
      error: "获取问卷结果失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      },
      status: 500
    });
  }
}

// ========== 认证路由处理函数 ==========

/**
 * 处理登录请求 - 重定向到 OAuth 提供商
 */
async function handleLogin(request, env, provider) {
  try {
    if (!provider) {
      return new Response(JSON.stringify({ error: "缺少 OAuth 提供商" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // 初始化 OAuth 客户端
    const oauthClients = initializeOAuthClients(env);
    const oauthClient = oauthClients[provider];

    if (!oauthClient) {
      return new Response(JSON.stringify({ error: `不支持的提供商: ${provider}` }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // 生成状态参数用于安全验证
    const state = generateState();

    // 获取授权 URL
    const authUrl = await getAuthorizationUrl(provider, oauthClient, state);

    // 检测是否为生产环境
    const isProduction = env.ENVIRONMENT === 'production' || request.url.startsWith('https://');
    const secureAttr = isProduction ? 'Secure;' : '';

    // 将状态存储在 cookie 中（实际项目中可以使用更安全的方式）
    const stateCookie = `oauth_state=${state}; HttpOnly; ${secureAttr} SameSite=Lax; Path=/; Max-Age=600`;

    // 重定向到 OAuth 提供商
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl.toString(),
        'Set-Cookie': stateCookie,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error(`登录处理错误 (${provider}):`, error);
    return new Response(JSON.stringify({
      error: "登录失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 500
    });
  }
}

/**
 * 处理 OAuth 回调
 */
async function handleCallback(request, env, provider) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      throw new Error('授权码缺失');
    }

    // 验证状态参数（简化实现，实际项目中需要更严格的验证）
    const cookieHeader = request.headers.get('Cookie');
    const cookies = cookieHeader ? parseCookies(cookieHeader) : {};
    const storedState = cookies['oauth_state'];

    if (!storedState || storedState !== state) {
      throw new Error('状态验证失败');
    }

    // 初始化 OAuth 客户端
    const oauthClients = initializeOAuthClients(env);
    const oauthClient = oauthClients[provider];

    if (!oauthClient) {
      throw new Error(`不支持的提供商: ${provider}`);
    }

    // 处理 OAuth 回调并获取用户信息
    const user = await handleOAuthCallback(provider, code, oauthClient);

    // 创建 JWT 会话令牌
    const sessionToken = await createSessionToken(user, env.JWT_SECRET);

    // 检测是否为生产环境
    const isProduction = env.ENVIRONMENT === 'production' || request.url.startsWith('https://');

    // 设置会话 cookie 并重定向到前端
    const sessionCookie = setSessionCookie(sessionToken, 7 * 24 * 60 * 60, isProduction);
    const clearStateCookie = isProduction
      ? 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
      : 'oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';

    // 重定向到前端应用
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

    // 创建 Headers 对象以支持多个 Set-Cookie 头部
    const headers = new Headers();
    headers.append('Location', `${frontendUrl}/dashboard`);
    headers.append('Set-Cookie', sessionCookie);
    headers.append('Set-Cookie', clearStateCookie);
    headers.append('Access-Control-Allow-Origin', '*');

    return new Response(null, {
      status: 302,
      headers
    });
  } catch (error) {
    console.error(`OAuth 回调处理错误 (${provider}):`, error);

    // 重定向到前端错误页面
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${frontendUrl}/?error=auth_failed&message=${encodeURIComponent(error.message)}`,
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * 处理登出请求
 */
async function handleLogout(request, env) {
  try {
    // 清除会话 cookie
    const clearCookie = clearSessionCookie();

    return new Response(JSON.stringify({ success: true, message: "已成功登出" }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request),
        "Set-Cookie": clearCookie
      }
    });
  } catch (error) {
    console.error('登出处理错误:', error);
    return new Response(JSON.stringify({
      error: "登出失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      },
      status: 500
    });
  }
}

/**
 * 获取当前用户信息
 */
async function handleGetCurrentUser(request, env) {
  try {
    const user = await getUserFromRequest(request, env.JWT_SECRET);

    if (!user) {
      return new Response(JSON.stringify({ authenticated: false }), {
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(request)
        },
        status: 401
      });
    }

    return new Response(JSON.stringify({
      authenticated: true,
      user: {
        userId: user.userId,
        provider: user.provider,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return new Response(JSON.stringify({
      error: "获取用户信息失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(request)
      },
      status: 500
    });
  }
}

/**
 * 获取用户的问卷列表
 */
async function handleGetMySurveys(request, env, ctx) {
  try {
    // 检查用户是否已登录
    const user = await getUserFromRequest(request, env.JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ error: "未登录，请先登录" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        status: 401
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: "数据库未配置" }), {
        headers: { "Content-Type": "application/json" },
        status: 500
      });
    }

    // 从 URL 查询参数获取分页信息
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // 获取用户的问卷列表
    const result = await listSurveys(env.DB, limit, offset, user.userId);

    return new Response(JSON.stringify({
      surveys: result.surveys,
      total: result.total,
      limit,
      offset,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email
      }
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error('获取用户问卷列表错误:', error);
    return new Response(JSON.stringify({
      error: "获取问卷列表失败",
      details: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 500
    });
  }
}

/**
 * 解析 Cookie 字符串的辅助函数
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}