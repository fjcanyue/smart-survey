import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";

const features = [
  {
    title: "AI 生成问卷",
    description: "输入业务需求，快速生成结构化问卷草稿并可继续微调。"
  },
  {
    title: "灵活分发",
    description: "支持链接、嵌入和二维码等多种分发方式，触达不同渠道受众。"
  },
  {
    title: "便捷收集",
    description: "实时查看填写进度，支持导出数据并触发自动化流程。"
  },
  {
    title: "安全合规",
    description: "前后端分离架构与权限控制，确保问卷与答卷数据安全。"
  }
];

const HomePage = () => {
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-primary">Smart Survey</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            智能问卷系统
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            借助 SurveyJS 与 AI 生成能力，轻松构建专业问卷并快速获取高质量反馈。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/create" className="inline-flex items-center gap-2">
              立即创建
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/survey/demo" className="inline-flex items-center gap-2">
              查看体验问卷
            </Link>
          </Button>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">产品亮点</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">工作流程</CardTitle>
            <CardDescription>三步完成问卷创建与发布</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">1. 录入需求</p>
              <p>描述问卷目标与核心问题，系统自动生成结构化草稿。</p>
            </div>
            <div>
              <p className="font-medium text-foreground">2. 拖拽微调</p>
              <p>在 Survey Creator 中调整题型、逻辑跳转与主题风格。</p>
            </div>
            <div>
              <p className="font-medium text-foreground">3. 分发收集</p>
              <p>一键发布并实时追踪答卷数据，支持导出和 API 回调。</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

export default HomePage;
