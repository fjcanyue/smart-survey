// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * 通用的 API 请求函数
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * 认证相关 API
 */
export const authAPI = {
  // 获取当前用户信息
  getCurrentUser: async () => {
    return apiRequest('/api/auth/me');
  },

  // 登出
  logout: async () => {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  // 获取用户的问卷列表
  getUserSurveys: async (limit = 50, offset = 0) => {
    return apiRequest(`/api/surveys/my?limit=${limit}&offset=${offset}`);
  },
};

/**
 * 问卷相关 API
 */
export const surveyAPI = {
  // 生成问卷
  generateSurvey: async (prompt, surveyId = null) => {
    return apiRequest('/api/surveys/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, surveyId }),
    });
  },

  // 保存问卷
  saveSurvey: async (id, json, themeType = 'default') => {
    return apiRequest('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ id, json, themeType }),
    });
  },

  // 获取问卷
  getSurvey: async (id) => {
    return apiRequest(`/api/surveys/${id}`);
  },

  // 提交问卷答案
  submitResult: async (surveyId, data) => {
    return apiRequest(`/api/results/${surveyId}`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  // 获取问卷结果
  getResults: async (surveyId, limit = 100, offset = 0) => {
    return apiRequest(`/api/results/${surveyId}?limit=${limit}&offset=${offset}`);
  },
};

/**
 * 登录 URL 生成器
 */
export const getLoginUrl = (provider) => {
  return `${API_BASE_URL}/api/auth/login/${provider}`;
};