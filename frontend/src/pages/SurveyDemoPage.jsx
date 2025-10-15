import React, { useState, useEffect } from "react";
import { ArrowLeft, FileText, Maximize2, Minimize2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { THEME_TYPES, getTheme } from "../lib/surveyThemes";

const surveyExamples = [
  {
    id: "retail-satisfaction",
    title: "消费者满意度调查",
    industry: "零售/电商",
    description: "全面评估顾客购物体验，从商品质量到售后服务的全流程反馈收集",
    questions: [
      {
        type: "rating",
        name: "overall_satisfaction",
        title: "您对本次购物的整体满意度如何？",
        rateMax: 5,
        rateType: "star"
      },
      {
        type: "rating",
        name: "product_quality",
        title: "您对收到商品的质量满意程度如何？",
        rateMax: 5,
        rateType: "star"
      },
      {
        type: "rating",
        name: "delivery_service",
        title: "您对物流配送服务的满意程度如何？",
        rateMax: 5,
        rateType: "star"
      },
      {
        type: "radiogroup",
        name: "purchase_channel",
        title: "您通常通过哪个渠道购买我们的产品？",
        choices: [
          "天猫旗舰店",
          "京东自营",
          "拼多多",
          "抖音小店",
          "线下门店",
          "其他"
        ]
      },
      {
        type: "comment",
        name: "improvement_suggestions",
        title: "您认为我们最需要改进的方面是什么？",
        placeholder: "请详细描述您的建议..."
      }
    ]
  },
  {
    id: "employee-engagement",
    title: "员工敬业度与满意度调查",
    industry: "人力资源管理",
    description: "评估员工工作满意度、团队协作和职业发展需求",
    questions: [
      {
        type: "matrix",
        name: "job_satisfaction",
        title: "请评估您对以下方面的满意程度",
        columns: [
          { value: 1, text: "非常不满意" },
          { value: 2, text: "不满意" },
          { value: 3, text: "一般" },
          { value: 4, text: "满意" },
          { value: 5, text: "非常满意" }
        ],
        rows: [
          "工作内容与职责",
          "薪酬福利",
          "职业发展机会",
          "团队协作氛围",
          "领导管理方式",
          "工作生活平衡"
        ]
      },
      {
        type: "radiogroup",
        name: "work_mode",
        title: "您更倾向于哪种工作模式？",
        choices: [
          "完全远程办公",
          "完全办公室办公",
          "混合办公（部分时间远程）",
          "无特别偏好"
        ]
      },
      {
        type: "checkbox",
        name: "training_needs",
        title: "您希望参加哪些类型的培训？（可多选）",
        choices: [
          "专业技能培训",
          "管理能力提升",
          "沟通表达技巧",
          "时间管理",
          "新技术学习",
          "无培训需求"
        ]
      },
      {
        type: "comment",
        name: "company_suggestions",
        title: "您对公司管理有哪些建议？",
        placeholder: "请详细描述您的建议..."
      }
    ]
  },
  {
    id: "product-feature-research",
    title: "新产品功能需求调研",
    industry: "产品开发",
    description: "收集用户对产品新功能的需求优先级和使用场景",
    questions: [
      {
        type: "rating",
        name: "feature_priority",
        title: "以下功能对您的重要程度如何？",
        rateMax: 5,
        rateType: "star"
      },
      {
        type: "radiogroup",
        name: "usage_frequency",
        title: "您使用我们产品的频率是？",
        choices: [
          "每天多次",
          "每天一次",
          "每周3-5次",
          "每周1-2次",
          "每月几次",
          "很少使用"
        ]
      },
      {
        type: "checkbox",
        name: "preferred_features",
        title: "您最希望新增哪些功能？（可多选）",
        choices: [
          "移动端APP",
          "数据分析报表",
          "自动化工作流",
          "团队协作功能",
          "第三方集成",
          "界面UI改版"
        ]
      },
      {
        type: "rating",
        name: "price_acceptance",
        title: "如果新增这些功能，您能接受的价格涨幅范围是？",
        rateMax: 5,
        rateType: "star"
      }
    ]
  },
  {
    id: "medical-service-experience",
    title: "医疗服务体验调查",
    industry: "医疗健康",
    description: "评估患者就医全流程体验，提升医疗服务质量",
    questions: [
      {
        type: "matrix",
        name: "service_quality",
        title: "请评估以下服务环节的满意度",
        columns: [
          { value: 1, text: "非常不满意" },
          { value: 2, text: "不满意" },
          { value: 3, text: "一般" },
          { value: 4, text: "满意" },
          { value: 5, text: "非常满意" }
        ],
        rows: [
          "挂号预约便利性",
          "候诊时间",
          "医生专业水平",
          "护士服务态度",
          "检查检验效率",
          "药品价格透明度"
        ]
      },
      {
        type: "radiogroup",
        name: "visit_reason",
        title: "您本次就诊的主要原因是？",
        choices: [
          "常规体检",
          "慢性病复诊",
          "急性病症",
          "健康咨询",
          "疫苗接种",
          "其他"
        ]
      },
      {
        type: "rating",
        name: "recommendation_willingness",
        title: "您会向亲友推荐本院的可能性有多大？",
        rateMax: 10,
        minRateDescription: "完全不会推荐",
        maxRateDescription: "一定会推荐"
      },
      {
        type: "comment",
        name: "medical_suggestions",
        title: "您对改善就医体验有何建议？",
        placeholder: "请详细描述您的建议..."
      }
    ]
  },
  {
    id: "education-course-feedback",
    title: "在线课程学习效果反馈",
    industry: "在线教育",
    description: "评估课程质量、学习体验和知识掌握情况",
    questions: [
      {
        type: "matrix",
        name: "course_evaluation",
        title: "请评估以下方面的满意度",
        columns: [
          { value: 1, text: "非常不满意" },
          { value: 2, text: "不满意" },
          { value: 3, text: "一般" },
          { value: 4, text: "满意" },
          { value: 5, text: "非常满意" }
        ],
        rows: [
          "课程内容实用性",
          "讲师授课水平",
          "课程结构逻辑性",
          "学习资料完整性",
          "作业练习设计",
          "学习平台易用性"
        ]
      },
      {
        type: "radiogroup",
        name: "learning_mode",
        title: "您更喜欢哪种学习方式？",
        choices: [
          "直播授课",
          "录播课程",
          "直播+录播结合",
          "自学教材",
          "小组讨论",
          "实践项目"
        ]
      },
      {
        type: "checkbox",
        name: "course_topics",
        title: "您希望学习哪些主题的课程？（可多选）",
        choices: [
          "编程开发",
          "数据分析",
          "产品设计",
          "市场营销",
          "项目管理",
          "职业素养"
        ]
      },
      {
        type: "rating",
        name: "knowledge_gain",
        title: "通过本课程，您的知识技能提升程度如何？",
        rateMax: 5,
        rateType: "star"
      }
    ]
  }
];

export default function SurveyDemoPage() {
  const navigate = useNavigate();
  const [selectedSurvey, setSelectedSurvey] = useState(surveyExamples[0]);
  const [jsonText, setJsonText] = useState("");
  const [surveyModel, setSurveyModel] = useState(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [selectedThemeType, setSelectedThemeType] = useState("default");

  // 将问题数组转换为 SurveyJS JSON 格式
  useEffect(() => {
    if (selectedSurvey) {
      const surveyJson = {
        title: selectedSurvey.title,
        description: selectedSurvey.description,
        pages: [
          {
            name: "page1",
            elements: selectedSurvey.questions
          }
        ]
      };
      
      setJsonText(JSON.stringify(surveyJson, null, 2));
      setSurveyModel(new Model(surveyJson));
    }
  }, [selectedSurvey]);

  // 应用主题到预览模型
  useEffect(() => {
    if (surveyModel) {
      const theme = getTheme(selectedThemeType, "light");
      if (theme) {
        surveyModel.applyTheme(theme);
      }
    }
  }, [surveyModel, selectedThemeType]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">问卷示例库</h1>
          <p className="text-muted-foreground">5个真实行业的专业问卷模板，供您参考和学习</p>
        </div>
      </div>

      {/* 模板选择器 */}
      <div className="grid gap-4 md:grid-cols-5">
        {surveyExamples.map((example) => (
          <Card
            key={example.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedSurvey.id === example.id && "border-primary shadow-md"
            )}
            onClick={() => setSelectedSurvey(example)}
          >
            <CardHeader className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {example.industry}
                </span>
              </div>
              <CardTitle className="text-sm leading-tight">{example.title}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {example.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* JSON 编辑器与预览 */}
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1.5">
            <CardTitle>问卷预览与 JSON</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-4 mt-2">
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
                  左侧为 SurveyJS JSON 格式，右侧为实时预览效果
                </span>
              </div>
            </CardDescription>
          </div>
          <Button onClick={() => {
            // 传递 JSON 数据和主题到创建页面
            navigate('/create', {
              state: {
                templateJson: JSON.parse(jsonText),
                themeType: selectedThemeType
              }
            });
          }}>
            基于此模板创建问卷
          </Button>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-md border bg-background">
          <div className="grid grid-cols-2 gap-4 h-[720px]">
            {/* 左侧：JSON 显示 */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-sm font-medium">SurveyJS JSON</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(jsonText);
                  }}
                >
                  复制 JSON
                </Button>
              </div>
              <textarea
                value={jsonText}
                readOnly
                className="h-[680px] w-full p-4 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring survey-preview-container"
                spellCheck={false}
              />
            </div>

            {/* 右侧：实时预览 */}
            <div className="flex flex-col border-l pl-4">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-sm font-medium">问卷预览</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsPreviewFullscreen(true)}
                  title="全屏预览"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-[680px] p-4 bg-muted/30 rounded-md survey-preview-container" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                {surveyModel ? (
                  <Survey model={surveyModel} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    暂无内容
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 全屏预览对话框 */}
      <Dialog open={isPreviewFullscreen} onOpenChange={setIsPreviewFullscreen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle>问卷预览 - {selectedSurvey.title}</DialogTitle>
                <DialogDescription>
                  {selectedSurvey.description}
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
            {surveyModel ? (
              <Survey model={surveyModel} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                暂无内容
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
    </div>
  );
}