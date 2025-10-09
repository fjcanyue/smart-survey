import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Chart } from "frappe-charts/dist/frappe-charts.min.esm";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { useToast } from "../hooks/use-toast";

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

// 图表组件
const QuestionChart = ({ stat }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !stat.data || Object.keys(stat.data).length === 0) {
      return;
    }

    const labels = Object.keys(stat.data);
    const values = Object.values(stat.data);

    // 根据问题类型选择图表类型
    let chartType = 'bar';
    if (stat.type === 'checkbox') {
      chartType = 'bar'; // 多选题用柱状图
    } else if (stat.type === 'rating') {
      chartType = 'bar'; // 评分题用柱状图
    } else if (labels.length <= 5) {
      chartType = 'pie'; // 选项少的用饼图
    }

    const chart = new Chart(chartRef.current, {
      type: chartType,
      data: {
        labels: labels,
        datasets: [
          {
            values: values
          }
        ]
      },
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'],
      height: 280,
      barOptions: {
        spaceRatio: 0.3,
        stacked: 0
      },
      tooltipOptions: {
        formatTooltipY: d => `${d} 人`
      }
    });

    return () => {
      // 清理图表
      if (chartRef.current) {
        chartRef.current.innerHTML = '';
      }
    };
  }, [stat]);

  const totalCount = Object.values(stat.data).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{stat.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">有效回答：{totalCount} 人</p>
      </div>
      <div ref={chartRef} className="w-full"></div>
    </div>
  );
};

const ResultsPage = () => {
  const { id } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [surveyJson, setSurveyJson] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

        // 同时获取问卷定义和结果
        const [surveyResponse, resultsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/surveys/${id}`),
          fetch(`${API_BASE_URL}/api/results/${id}`)
        ]);

        if (!surveyResponse.ok || !resultsResponse.ok) {
          throw new Error("加载失败");
        }

        const surveyData = await surveyResponse.json();
        const resultsData = await resultsResponse.json();

        setSurveyJson(surveyData.json);
        setResults(resultsData.results || []);
      } catch (error) {
        console.error("获取问卷结果失败:", error);
        toast({
          variant: "destructive",
          title: "加载失败",
          description: error.message || "无法加载问卷结果，请稍后再试",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResults();
    }
  }, [id, toast]);

  // 构建问题名称到标题的映射
  const questionMap = useMemo(() => {
    if (!surveyJson) return {};

    const map = {};

    // 遍历所有页面和元素
    surveyJson.pages?.forEach(page => {
      page.elements?.forEach(element => {
        if (element.name && element.title) {
          map[element.name] = {
            title: element.title,
            type: element.type,
            choices: element.choices, // 用于选择题的选项映射
            rateMin: element.rateMin,
            rateMax: element.rateMax,
            minRateDescription: element.minRateDescription,
            maxRateDescription: element.maxRateDescription
          };
        }
      });
    });

    return map;
  }, [surveyJson]);

  // 格式化答案显示
  const formatAnswer = (questionName, value, questionInfo) => {
    if (value === null || value === undefined) {
      return "未填写";
    }

    // 如果没有问题信息，直接返回值
    if (!questionInfo) {
      return String(value);
    }

    // 根据问题类型格式化答案
    switch (questionInfo.type) {
      case "rating":
        // 评分类型，显示评分和描述
        let ratingText = `${value}`;
        if (questionInfo.rateMin && questionInfo.rateMax) {
          ratingText += ` (${questionInfo.rateMin}-${questionInfo.rateMax})`;
        }
        if (value === questionInfo.rateMin && questionInfo.minRateDescription) {
          ratingText += ` - ${questionInfo.minRateDescription}`;
        } else if (value === questionInfo.rateMax && questionInfo.maxRateDescription) {
          ratingText += ` - ${questionInfo.maxRateDescription}`;
        }
        return ratingText;

      case "dropdown":
      case "radiogroup":
        // 单选题，从 choices 中查找对应的 text
        if (questionInfo.choices && Array.isArray(questionInfo.choices)) {
          const choice = questionInfo.choices.find(c => {
            // choices 可能是字符串数组或对象数组
            if (typeof c === 'string') {
              return c === value;
            }
            return c.value === value;
          });

          if (choice) {
            // 如果是对象，返回 text；如果是字符串，返回自身
            return typeof choice === 'object' ? choice.text : choice;
          }
        }
        return String(value);

      case "checkbox":
        // 多选题，value 是数组
        if (Array.isArray(value)) {
          if (questionInfo.choices && Array.isArray(questionInfo.choices)) {
            // 将每个 value 转换为对应的 text
            return value.map(v => {
              const choice = questionInfo.choices.find(c => {
                if (typeof c === 'string') {
                  return c === v;
                }
                return c.value === v;
              });

              if (choice) {
                return typeof choice === 'object' ? choice.text : choice;
              }
              return v;
            }).join(", ");
          }
          return value.join(", ");
        }
        return String(value);

      case "boolean":
        // 布尔类型
        return value ? "是" : "否";

      default:
        // 其他类型直接返回字符串
        return String(value);
    }
  };

  // 统计每个问题的选项分布
  const questionStats = useMemo(() => {
    if (!surveyJson || !results.length) return [];

    const stats = [];

    // 遍历所有问题
    surveyJson.pages?.forEach(page => {
      page.elements?.forEach(element => {
        const { name, title, type, choices, rateMin, rateMax } = element;

        // 只为有选项的问题类型生成统计
        if (['dropdown', 'radiogroup', 'checkbox', 'rating'].includes(type)) {
          const stat = {
            name,
            title,
            type,
            data: {}
          };

          if (type === 'rating') {
            // 评分题：统计每个分数的数量
            const min = rateMin || 1;
            const max = rateMax || 5;
            for (let i = min; i <= max; i++) {
              stat.data[i] = 0;
            }

            results.forEach(result => {
              const value = result.data[name];
              if (value !== null && value !== undefined) {
                stat.data[value] = (stat.data[value] || 0) + 1;
              }
            });
          } else if (choices && Array.isArray(choices)) {
            // 选择题：统计每个选项的数量
            choices.forEach(choice => {
              const choiceValue = typeof choice === 'string' ? choice : choice.value;
              const choiceText = typeof choice === 'string' ? choice : choice.text;
              stat.data[choiceText] = 0;
            });

            results.forEach(result => {
              const value = result.data[name];
              if (value !== null && value !== undefined) {
                if (type === 'checkbox' && Array.isArray(value)) {
                  // 多选题
                  value.forEach(v => {
                    const choice = choices.find(c => {
                      const cValue = typeof c === 'string' ? c : c.value;
                      return cValue === v;
                    });
                    if (choice) {
                      const choiceText = typeof choice === 'string' ? choice : choice.text;
                      stat.data[choiceText] = (stat.data[choiceText] || 0) + 1;
                    }
                  });
                } else {
                  // 单选题
                  const choice = choices.find(c => {
                    const cValue = typeof c === 'string' ? c : c.value;
                    return cValue === value;
                  });
                  if (choice) {
                    const choiceText = typeof choice === 'string' ? choice : choice.text;
                    stat.data[choiceText] = (stat.data[choiceText] || 0) + 1;
                  }
                }
              }
            });
          }

          // 只添加有数据的统计
          if (Object.keys(stat.data).length > 0) {
            stats.push(stat);
          }
        }
      });
    });

    return stats;
  }, [surveyJson, results]);

  const completionRate = useMemo(() => {
    if (!results.length) {
      return "0%";
    }
    // TODO: 用真实填写人数/访问人数计算
    return "92%";
  }, [results]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        正在加载问卷结果...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">问卷结果</h1>
          <p className="text-sm text-muted-foreground">问卷编号：{id || "demo"}</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          导出为 PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>数据概览</CardTitle>
          <CardDescription>快速了解问卷的填写情况与整体满意度。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">答卷数量</p>
            <p className="text-3xl font-semibold">{results.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">完成率</p>
            <p className="text-3xl font-semibold">{completionRate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">最后更新时间</p>
            <p className="text-lg font-medium">{formatDateTime(results[0]?.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 统计图表 */}
      {questionStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>数据分析</CardTitle>
            <CardDescription>各问题选项分布统计图表</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 md:grid-cols-2">
              {questionStats.map((stat) => (
                <QuestionChart key={stat.name} stat={stat} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>详细答卷</CardTitle>
          <CardDescription>查看每份答卷的填写内容，评估用户反馈详情。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="rounded-lg border bg-card/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  提交时间：{formatDateTime(result.createdAt)}
                </p>
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  #{result.id.toString().padStart(3, "0")}
                </span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {Object.entries(result.data).map(([key, value]) => {
                  const questionInfo = questionMap[key];
                  const questionTitle = questionInfo?.title || key;
                  const formattedAnswer = formatAnswer(key, value, questionInfo);

                  return (
                    <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
                      <dt className="w-48 shrink-0 font-medium text-foreground">
                        {questionTitle}
                      </dt>
                      <dd className="flex-1 whitespace-pre-wrap text-muted-foreground">
                        {formattedAnswer}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
          {!results.length && (
            <p className="text-sm text-muted-foreground">
              暂无答卷记录，尝试稍后刷新。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPage;
