import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import { Sun, Moon } from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { getTheme, THEME_TYPES } from "../lib/surveyThemes";

const SurveyRunnerPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [surveyModel, setSurveyModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // 主题类型（从服务器加载，不可更改）和模式（light/dark，用户可切换）
  const [themeType, setThemeType] = useState("default");
  const [themeMode, setThemeMode] = useState("light");

  const handleSubmit = useCallback(async (data) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

      const response = await fetch(`${API_BASE_URL}/api/results/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: data
        })
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      setSubmittedData(data);
      setSubmitted(true);
      toast({
        variant: "success",
        title: "提交成功",
        description: "感谢您的参与！",
      });
    } catch (error) {
      console.error("提交答卷失败:", error);
      toast({
        variant: "destructive",
        title: "提交失败",
        description: error.message || "提交失败，请稍后再试"
      });
    }
  }, [id, toast]);

  useEffect(() => {
    const fetchSurvey = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

        const response = await fetch(`${API_BASE_URL}/api/surveys/${id}`);

        if (!response.ok) {
          throw new Error("加载问卷失败");
        }

        const data = await response.json();

        if (data.json) {
          const model = new Model(data.json);
          model.onComplete.add((sender) => {
            handleSubmit(sender.data);
          });

          setSurveyModel(model);

          // 设置从服务器获取的主题类型
          if (data.themeType) {
            setThemeType(data.themeType);
          }
        } else {
          throw new Error("问卷数据格式不正确");
        }
      } catch (error) {
        console.error("获取问卷失败:", error);
        toast({
          variant: "destructive",
          title: "加载失败",
          description: error.message || "无法加载问卷，请稍后再试",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSurvey();
    }
  }, [id, handleSubmit, toast]);

  // 应用主题
  useEffect(() => {
    if (surveyModel && themeType) {
      const theme = getTheme(themeType, themeMode);
      if (theme) {
        surveyModel.applyTheme(theme);
      }
    }
  }, [surveyModel, themeType, themeMode]);

  // 处理主题模式切换（只能切换 light/dark）
  const handleThemeModeToggle = () => {
    setThemeMode(prevMode => prevMode === "light" ? "dark" : "light");
  };

  // 获取当前主题的显示名称
  const getCurrentThemeName = () => {
    const themeTypeObj = THEME_TYPES.find(t => t.id === themeType);
    const typeName = themeTypeObj ? themeTypeObj.name : "默认";
    const modeName = themeMode === "light" ? "浅色" : "深色";
    return `${typeName} (${modeName})`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        正在加载问卷...
      </div>
    );
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>感谢您的反馈</CardTitle>
          <CardDescription>我们已记录本次问卷的填写结果。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>问卷编号：{id || "demo"}</p>
          <pre className="rounded-md bg-muted p-4 text-xs text-foreground">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={() => setSubmitted(false)}>
            返回问卷
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 py-5">
        <Card className="mx-auto w-full max-w-4xl">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {/* <span className="text-sm font-medium text-muted-foreground">
                  问卷主题:
                </span>
                <span className="text-sm font-medium">
                  {getCurrentThemeName()}
                </span> */}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleThemeModeToggle}
                className="self-start sm:self-auto"
                title={themeMode === "light" ? "切换到深色模式" : "切换到浅色模式"}
              >
                {themeMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {surveyModel && <Survey model={surveyModel} id="surveyContainer" />}
          </CardContent>
        </Card>
      </div>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            智能问卷
          </Link>
          {" "}提供技术支持
        </div>
      </footer>
    </div>
  );
};

export default SurveyRunnerPage;
