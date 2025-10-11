import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SurveyCreatorPage from "./pages/SurveyCreatorPage";
import SurveyRunnerPage from "./pages/SurveyRunnerPage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";

// 登录按钮组件
function LoginButtons() {
  const { login } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => login('github')}
      >
        GitHub 登录
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => login('google')}
      >
        Google 登录
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => login('microsoft')}
      >
        Microsoft 登录
      </Button>
    </div>
  );
}

// 用户菜单组件
function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium">{user.name}</span>
      </div>
      <Button variant="ghost" asChild>
        <Link to="/dashboard">我的问卷</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={logout}
      >
        登出
      </Button>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const { authenticated, loading } = useAuth();

  const navItems = [
    { to: "/", label: "首页" },
    { to: "/create", label: "创建问卷" }
  ];

  // 判断是否为问卷答题页面
  const isSurveyPage = location.pathname.startsWith("/survey/");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isSurveyPage && (
        <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="text-lg font-semibold">
              智能问卷
            </Link>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-2">
                {navItems.map((item) => (
                  <Button key={item.to} variant="ghost" asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </Button>
                ))}
              </nav>
              {authenticated ? <UserMenu /> : (
                <Button asChild variant="default" size="sm">
                  <Link to="/login">登录</Link>
                </Button>
              )}
            </div>
          </div>
        </header>
      )}
      <main className={isSurveyPage ? "py-10" : "container py-10"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create" element={<SurveyCreatorPage />} />
          <Route path="/survey/:id" element={<SurveyRunnerPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
