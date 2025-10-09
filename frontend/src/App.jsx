import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";
import HomePage from "./pages/HomePage";
import SurveyCreatorPage from "./pages/SurveyCreatorPage";
import SurveyRunnerPage from "./pages/SurveyRunnerPage";
import ResultsPage from "./pages/ResultsPage";

function AppContent() {
  const location = useLocation();
  const navItems = [
    { to: "/", label: "首页" },
    { to: "/create", label: "创建问卷" }
  ];

  // 判断是否为问卷答题页面
  const isSurveyPage = location.pathname.startsWith("/survey/");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isSurveyPage && (
        <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="text-lg font-semibold">
              智能问卷
            </Link>
            <nav className="flex items-center gap-2">
              {navItems.map((item) => (
                <Button key={item.to} variant="ghost" asChild>
                  <Link to={item.to}>{item.label}</Link>
                </Button>
              ))}
            </nav>
          </div>
        </header>
      )}
      <main className={isSurveyPage ? "py-10" : "container py-10"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<SurveyCreatorPage />} />
          <Route path="/survey/:id" element={<SurveyRunnerPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
