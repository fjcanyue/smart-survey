import React from "react";
import { Github, LogIn, Mail, SquareArrowRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const ProviderButton = ({ onClick, icon: Icon, children }) => (
  <Button variant="outline" className="w-full justify-start gap-2" onClick={onClick}>
    <Icon className="h-4 w-4" />
    {children}
  </Button>
);

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const from = (location.state && location.state.from) || "/dashboard";

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">欢迎回来</CardTitle>
            <CardDescription>使用第三方账号快速登录 Smart Survey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProviderButton icon={Github} onClick={() => login("github")}>使用 GitHub 登录</ProviderButton>
            <ProviderButton icon={Mail} onClick={() => login("google")}>使用 Google 登录</ProviderButton>
            <ProviderButton icon={LogIn} onClick={() => login("microsoft")}>使用 Microsoft 登录</ProviderButton>

            <div className="pt-4 text-center text-xs text-muted-foreground">
              登录即表示同意
              <Link to="/" className="underline underline-offset-2"> 服务条款 </Link>
              与
              <Link to="/" className="underline underline-offset-2"> 隐私政策</Link>
              。
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
                返回
                <SquareArrowRight className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
