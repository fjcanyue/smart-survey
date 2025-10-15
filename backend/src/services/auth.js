/**
 * 认证服务模块
 * 支持 GitHub, Google, Microsoft, X (Twitter) OAuth 登录
 */

import { GitHub, Google, MicrosoftEntraId } from 'arctic';
import { SignJWT, jwtVerify } from 'jose';

/**
 * 生成唯一的用户 ID
 * 规则: {provider}:{provider_user_id}
 *
 * @param {string} provider - OAuth 提供商 (github, google, microsoft, twitter)
 * @param {string} providerUserId - 提供商返回的用户 ID
 * @returns {string} 唯一用户 ID
 */
export function generateUserId(provider, providerUserId) {
  return `${provider.toLowerCase()}:${providerUserId}`;
}

/**
 * 初始化 OAuth 客户端
 */
export function initializeOAuthClients(env) {
  const clients = {};

  // GitHub OAuth
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    clients.github = new GitHub(
      env.GITHUB_CLIENT_ID,
      env.GITHUB_CLIENT_SECRET,
      `${env.APP_URL || 'http://localhost:8787'}/api/auth/callback/github`
    );
  }

  // Google OAuth
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    clients.google = new Google(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${env.APP_URL || 'http://localhost:8787'}/api/auth/callback/google`
    );
  }

  // Microsoft OAuth (使用 Microsoft Entra ID，前身为 Azure AD)
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    const tenantId = env.MICROSOFT_TENANT_ID || 'common'; // 默认使用 common 租户
    clients.microsoft = new MicrosoftEntraId(
      tenantId,
      env.MICROSOFT_CLIENT_ID,
      env.MICROSOFT_CLIENT_SECRET,
      `${env.APP_URL || 'http://localhost:8787'}/api/auth/callback/microsoft`
    );
  }

  return clients;
}

/**
 * 获取 OAuth 授权 URL
 */
export async function getAuthorizationUrl(provider, oauthClient, state) {
  switch (provider) {
    case 'github':
      return await oauthClient.createAuthorizationURL(state, ['user:email']);

    case 'google':
      return await oauthClient.createAuthorizationURL(state, ['openid', 'profile', 'email']);

    case 'microsoft':
      return await oauthClient.createAuthorizationURL(state, ['openid', 'profile', 'email']);

    case 'twitter':
      // Twitter/X OAuth 2.0 需要特殊处理
      throw new Error('Twitter OAuth integration pending');

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * 验证 OAuth 回调并获取用户信息
 */
export async function handleOAuthCallback(provider, code, oauthClient, redirectUrl) {
  try {
    console.log(`开始处理 ${provider} OAuth 回调，code: ${code.substring(0, 10)}...`);

    // 获取访问令牌
    const tokens = await oauthClient.validateAuthorizationCode(code, redirectUrl);
    console.log(`${provider} tokens:`, tokens);

    // 根据不同提供商获取用户信息
    const accessToken = typeof tokens.accessToken === 'function' ? tokens.accessToken() : tokens.accessToken;
    if (!accessToken) {
      throw new Error('Access token not found in response');
    }
    console.log(`${provider} access token:`, accessToken);
    console.log(`${provider} access token type:`, typeof accessToken);

    const userInfo = await fetchUserInfo(provider, accessToken);
    console.log(`${provider} 用户信息获取成功:`, userInfo);

    // 生成唯一用户 ID
    const userId = generateUserId(provider, userInfo.id);

    return {
      userId,
      provider,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.avatar,
      providerUserId: userInfo.id
    };
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);
    console.error(`详细错误信息:`, error.stack);
    throw error;
  }
}

/**
 * 从不同提供商获取用户信息
 */
async function fetchUserInfo(provider, accessToken) {
  console.log(`fetchUserInfo called with provider: ${provider}, accessToken:`, accessToken, 'type:', typeof accessToken);

  let apiUrl;

  switch (provider) {
    case 'github':
      apiUrl = 'https://api.github.com/user';
      break;
    case 'google':
      apiUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
      break;
    case 'microsoft':
      apiUrl = 'https://graph.microsoft.com/v1.0/me';
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  console.log(`Fetching user info from: ${apiUrl}`);
  console.log(`Using Authorization header: Bearer ${accessToken}`);

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'User-Agent': 'Smart-Survey-App'
    }
  });

  console.log(`Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch user info from ${provider}:`, response.status, errorText);
    throw new Error(`Failed to fetch user info from ${provider}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // 对于 GitHub，需要额外获取邮箱信息
  if (provider === 'github') {
    try {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Smart-Survey-App'
        }
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(email => email.primary && email.verified);
        if (primaryEmail) {
          data.email = primaryEmail.email;
        }
      }
    } catch (emailError) {
      console.warn('Failed to fetch GitHub emails:', emailError);
    }
  }

  // 标准化不同提供商的用户信息格式
  return normalizeUserInfo(provider, data);
}

/**
 * 标准化不同提供商的用户信息
 */
function normalizeUserInfo(provider, data) {
  switch (provider) {
    case 'github':
      return {
        id: String(data.id),
        email: data.email,
        name: data.name || data.login,
        avatar: data.avatar_url
      };

    case 'google':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.picture
      };

    case 'microsoft':
      return {
        id: data.id,
        email: data.userPrincipalName || data.mail,
        name: data.displayName,
        avatar: null // Microsoft Graph 不直接提供头像 URL
      };

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * 创建 JWT 会话令牌
 */
export async function createSessionToken(user, jwtSecret) {
  const secret = new TextEncoder().encode(jwtSecret);

  const token = await new SignJWT({
    userId: user.userId,
    provider: user.provider,
    email: user.email,
    name: user.name,
    avatar: user.avatar
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 天过期
    .sign(secret);

  return token;
}

/**
 * 验证 JWT 会话令牌
 */
export async function verifySessionToken(token, jwtSecret) {
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * 从请求中提取用户会话
 */
export async function getUserFromRequest(request, jwtSecret) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies['session'];

  if (!sessionToken) {
    return null;
  }

  return await verifySessionToken(sessionToken, jwtSecret);
}

/**
 * 解析 Cookie 字符串
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

/**
 * 生成状态参数（用于 OAuth CSRF 保护）
 */
export function generateState() {
  return crypto.randomUUID();
}

/**
 * 设置会话 Cookie
 * 在开发环境（localhost）移除 Secure 属性，因为 HTTP 不支持
 */
export function setSessionCookie(token, maxAge = 7 * 24 * 60 * 60, isProduction = false, requestUrl = null) {
  const secure = isProduction ? ' Secure;' : '';
  let cookieString = `session=${token}; HttpOnly; ${secure}Path=/; Max-Age=${maxAge}`;

  // 在生产环境（HTTPS）下使用 SameSite=None 以支持跨域（前端在 pages.dev，后端在 workers.dev）
  // 在开发环境（HTTP）下使用 SameSite=Lax（因为 SameSite=None 必须配合 Secure）
  if (isProduction) {
    cookieString += '; SameSite=None';
  } else {
    cookieString += '; SameSite=Lax';
  }

  return cookieString;
}

/**
 * 清除会话 Cookie
 */
export function clearSessionCookie(isProduction = false) {
  const secure = isProduction ? ' Secure;' : '';
  const sameSite = isProduction ? 'SameSite=None' : 'SameSite=Lax';
  return `session=; HttpOnly; ${secure}${sameSite}; Path=/; Max-Age=0`;
}
