import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // 检查用户认证状态
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          setAuthenticated(true);
        } else {
          setUser(null);
          setAuthenticated(false);
        }
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // 登录函数 - 重定向到 OAuth 提供商
  const login = (provider) => {
    window.location.href = `${API_BASE_URL}/api/auth/login/${provider}`;
  };

  // 登出函数
  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUser(null);
        setAuthenticated(false);
        // 可选：重定向到首页
        window.location.href = '/';
      } else {
        console.error('登出失败');
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    }
  };

  // 获取用户的问卷列表
  const getUserSurveys = async (limit = 50, offset = 0) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/surveys/my?limit=${limit}&offset=${offset}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('获取问卷列表失败');
      }
    } catch (error) {
      console.error('获取用户问卷失败:', error);
      throw error;
    }
  };

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 处理 URL 中的认证错误
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');

    if (error === 'auth_failed') {
      console.error('认证失败:', message);
      // 这里可以显示错误消息给用户
      // 清理 URL 参数
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const value = {
    user,
    authenticated,
    loading,
    login,
    logout,
    checkAuth,
    getUserSurveys,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}