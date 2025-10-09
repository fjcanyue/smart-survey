import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wand2, Save, Share2, Copy, ExternalLink, Edit2, Code, Maximize2, Minimize2 } from "lucide-react";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";
import { THEME_TYPES, getTheme } from "../lib/surveyThemes";

const SurveyCreatorPage = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [surveyId, setSurveyId] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 新增：主题选择状态
  const [selectedThemeType, setSelectedThemeType] = useState("default");

  // 新增：编辑模式状态（json 或 creator）
  const [editMode, setEditMode] = useState("json"); // "json" | "creator"

  // 新增：JSON 文本状态
  const [jsonText, setJsonText] = useState(JSON.stringify({ pages: [] }, null, 2));
  const [jsonError, setJsonError] = useState(null);

  // 新增：预览模型
  const [surveyModel, setSurveyModel] = useState(() => new Model({ pages: [] }));

  // 新增：全屏预览状态
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const creator = useMemo(() => {
    const instance = new SurveyCreator({
      showLogicTab: true,
      showThemeTab: true,
      pageEditMode: "standard",
      defaultLanguage: "zh-cn"
    });

    instance.toolbox.addItems([
      { name: "rating", iconName: "icon-rating" },
      { name: "comment", iconName: "icon-comment" },
      { name: "checkbox", iconName: "icon-checkbox" },
      { name: "dropdown", iconName: "icon-dropdown" }
    ]);
    return instance;
  }, []);

  // 从 URL 加载已存在的问卷
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      loadSurvey(id);
    }
  }, [searchParams]);

  // 新增：当 JSON 文本变化时，更新预览
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError(null);
      setSurveyModel(new Model(parsed));
    } catch (error) {
      setJsonError(error.message);
    }
  }, [jsonText]);

  // 应用主题到预览模型
  useEffect(() => {
    if (surveyModel) {
      const theme = getTheme(selectedThemeType, "light");
      if (theme) {
        surveyModel.applyTheme(theme);
      }
    }
  }, [surveyModel, selectedThemeType]);

  // 新增：同步 creator 和 jsonText
  useEffect(() => {
    if (editMode === "creator") {
      // 切换到 creator 时，从 jsonText 更新 creator
      try {
        const parsed = JSON.parse(jsonText);
        // 使用 setTimeout 确保 creator 组件已经完全挂载
        setTimeout(() => {
          creator.JSON = parsed;
        }, 0);
      } catch (error) {
        // JSON 格式错误时不更新
      }
    }
  }, [editMode, creator]);

  const loadSurvey = async (id) => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

      const response = await fetch(`${API_BASE_URL}/api/surveys/${id}`);

      if (!response.ok) {
        throw new Error("加载问卷失败");
      }

      const data = await response.json();

      if (data.json) {
        creator.JSON = data.json;
        setJsonText(JSON.stringify(data.json, null, 2));
        setSurveyId(id);
        // 加载主题类型
        if (data.themeType) {
          setSelectedThemeType(data.themeType);
        }
        toast({
          title: "加载成功",
          description: "问卷已加载，可以继续编辑",
        });
      }
    } catch (error) {
      console.error("加载问卷失败:", error);
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSurvey = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "请输入问卷描述",
        description: "请先描述您想要创建的问卷内容",
      });
      return;
    }

    setLoading(true);
    try {
      // 调用后端 API 生成问卷
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

      const response = await fetch(`${API_BASE_URL}/api/surveys/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "生成问卷失败" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 将生成的问卷 JSON 加载到编辑器中
      if (data.json) {
        creator.JSON = data.json;
        setJsonText(JSON.stringify(data.json, null, 2));
        setSurveyId(data.id); // 保存生成的问卷 ID
        toast({
          variant: "success",
          title: "生成成功！",
          description: "问卷已生成，您可以继续在编辑器中调整",
        });
      } else {
        throw new Error("返回的数据格式不正确");
      }
    } catch (error) {
      console.error("生成问卷失败:", error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSurvey = async () => {
    // 根据编辑模式获取 JSON
    let surveyJson;
    if (editMode === "json") {
      try {
        surveyJson = JSON.parse(jsonText);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "JSON 格式错误",
          description: "请修正 JSON 格式后再保存",
        });
        return;
      }
    } else {
      surveyJson = creator.JSON;
      // 同步到 jsonText
      setJsonText(JSON.stringify(surveyJson, null, 2));
    }

    // 验证问卷内容
    if (!surveyJson.pages || surveyJson.pages.length === 0) {
      toast({
        variant: "destructive",
        title: "问卷内容为空",
        description: "请先生成或编辑问卷",
      });
      return;
    }

    setSaving(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

      // 如果没有 surveyId，生成一个新的
      const idToSave = surveyId || `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(`${API_BASE_URL}/api/surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: idToSave,
          json: surveyJson,
          themeType: selectedThemeType // 保存主题类型
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "保存问卷失败" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 更新 surveyId
      if (!surveyId) {
        setSurveyId(idToSave);
        // 更新 URL 以便刷新页面时可以继续编辑
        navigate(`/create?id=${idToSave}`, { replace: true });
      }

      toast({
        variant: "success",
        title: "保存成功！",
        description: surveyId ? "问卷已更新" : "问卷已保存，您可以继续编辑",
      });
    } catch (error) {
      console.error("保存问卷失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShareSurvey = () => {
    if (!surveyId) {
      toast({
        variant: "destructive",
        title: "无法分享",
        description: "请先保存问卷后再分享",
      });
      return;
    }

    setShareDialogOpen(true);
  };

  const copySurveyUrl = () => {
    const surveyUrl = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(surveyUrl).then(() => {
      toast({
        variant: "success",
        title: "已复制",
        description: "问卷链接已复制到剪贴板",
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "复制失败",
        description: "请手动复制链接",
      });
    });
  };

  const copyResultsUrl = () => {
    const resultsUrl = `${window.location.origin}/results/${surveyId}`;
    navigator.clipboard.writeText(resultsUrl).then(() => {
      toast({
        variant: "success",
        title: "已复制",
        description: "结果链接已复制到剪贴板",
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "复制失败",
        description: "请手动复制链接",
      });
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>生成问卷草稿</CardTitle>
          <CardDescription>
            描述问卷目标、目标人群或核心问题，系统将基于示例逻辑生成初稿。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="示例：为企业客户编写一份产品满意度调研，重点关注功能易用性和售后体验。"
            rows={5}
          />
          <div className="flex items-center gap-4">
            <label htmlFor="theme-type-select" className="text-sm font-medium whitespace-nowrap">
              问卷主题:
            </label>
            <select
              id="theme-type-select"
              value={selectedThemeType}
              onChange={(e) => setSelectedThemeType(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {THEME_TYPES.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              用户答题时可切换明暗模式
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            生成后可继续在下方编辑器中调整题型、逻辑和主题。
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button onClick={handleGenerateSurvey} disabled={loading} className={cn({ "cursor-progress": loading })}>
            <Wand2 className="mr-2 h-4 w-4" />
            {loading ? "生成中..." : "智能生成问卷"}
          </Button>
          <Button variant="outline" onClick={() => {
            const emptyJson = { pages: [] };
            setJsonText(JSON.stringify(emptyJson, null, 2));
            creator.JSON = emptyJson;
          }}>
            清空内容
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1.5">
            <CardTitle>问卷设计器</CardTitle>
            <CardDescription>
              {editMode === "json"
                ? "编辑 JSON 代码，右侧实时预览问卷效果"
                : "拖拽组件、设置逻辑跳转或切换主题"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={editMode === "json" ? "default" : "outline"}
              onClick={() => {
                if (editMode === "creator") {
                  // 从 creator 切换到 json，保存当前 creator 的内容
                  setJsonText(JSON.stringify(creator.JSON, null, 2));
                }
                setEditMode("json");
              }}
              disabled={loading}
            >
              <Code className="mr-2 h-4 w-4" />
              JSON 编辑
            </Button>
            <Button
              variant={editMode === "creator" ? "default" : "outline"}
              onClick={() => setEditMode("creator")}
              disabled={loading}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              可视化编辑
            </Button>
            <div className="border-l mx-1"></div>
            <Button onClick={handleSaveSurvey} disabled={saving || loading || jsonError} className={cn({ "cursor-progress": saving })}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "保存中..." : surveyId ? "更新问卷" : "保存问卷"}
            </Button>
            <Button variant="outline" onClick={handleShareSurvey} disabled={!surveyId || saving || loading}>
              <Share2 className="mr-2 h-4 w-4" />
              分享问卷
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-md border bg-background">
          {editMode === "json" ? (
            <div className="grid grid-cols-2 gap-4 h-[720px]">
              {/* 左侧：JSON 编辑器 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-sm font-medium">JSON 编辑器</h3>
                  {jsonError && (
                    <span className="text-xs text-destructive">格式错误: {jsonError}</span>
                  )}
                </div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className={cn(
                    "h-[680px] w-full p-4 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring survey-preview-container",
                    jsonError && "border-destructive"
                  )}
                  spellCheck={false}
                />
              </div>

              {/* 右侧：实时预览 */}
              <div className="flex flex-col border-l pl-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-sm font-medium">实时预览</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsPreviewFullscreen(true)}
                    disabled={jsonError}
                    title="全屏预览"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-[680px] p-4 bg-muted/30 rounded-md survey-preview-container" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                  {!jsonError && surveyModel ? (
                    <Survey model={surveyModel} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      {jsonError ? "JSON 格式错误，无法预览" : "暂无内容"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[720px]">
              <SurveyCreatorComponent key={editMode} creator={creator} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 全屏预览对话框 */}
      <Dialog open={isPreviewFullscreen} onOpenChange={setIsPreviewFullscreen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle>问卷预览</DialogTitle>
                <DialogDescription>
                  查看问卷在实际场景中的显示效果
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewFullscreen(false)}
                title="退出全屏"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto survey-preview-container p-6 bg-muted/30 rounded-md my-4">
            {!jsonError && surveyModel ? (
              <Survey model={surveyModel} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {jsonError ? "JSON 格式错误，无法预览" : "暂无内容"}
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsPreviewFullscreen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分享对话框 */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享问卷</DialogTitle>
            <DialogDescription>
              复制以下链接分享给受访者，或查看问卷结果。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">问卷链接</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/survey/${surveyId}`}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={copySurveyUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`/survey/${surveyId}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">结果链接</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/results/${surveyId}`}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={copyResultsUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`/results/${surveyId}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SurveyCreatorPage;
