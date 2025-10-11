import React from "react";
import { ArrowRight, ShieldCheck, Sparkles, Users, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const features = [
  { title: "AI 智能生成", description: "描述目标与受众，自动生成结构化问卷草案，可继续微调。", icon: Sparkles },
  { title: "多渠道分发", description: "链接、嵌入、二维码多种方式分发，覆盖不同场景。", icon: Workflow },
  { title: "实时数据与洞察", description: "实时查看作答进度，自动统计与图表洞察，导出便捷。", icon: Users },
  { title: "安全与合规", description: "前后端分层与权限控制，确保问卷与数据的安全。", icon: ShieldCheck },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-muted/40 p-8 md:p-12">
        <div className="max-w-3xl space-y-5">
          <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">Smart Survey</span>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">用更聪明的方式创建与分析问卷</h1>
          <p className="text-muted-foreground text-lg">基于 SurveyJS 与 AI 助力，几分钟内从想法到上线收集，实时洞察结果，驱动更快更好的决策。</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/create">
                立即创建
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/survey/demo">查看示例</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">产品亮点</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="h-full">
              <CardHeader className="space-y-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">如何开始</CardTitle>
            <CardDescription>三步完成，从构想到洞察</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 text-sm text-muted-foreground md:grid-cols-3">
            <div>
              <p className="font-medium text-foreground">1. 描述目标</p>
              <p>输入问卷目的与受众，系统生成结构化问卷草案。</p>
            </div>
            <div>
              <p className="font-medium text-foreground">2. 拖拽微调</p>
              <p>在问卷编辑器中配置逻辑跳转、校验与样式。</p>
            </div>
            <div>
              <p className="font-medium text-foreground">3. 分发与分析</p>
              <p>一键发布并实时查看数据走势，支持导出与回流。</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

