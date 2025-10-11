import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

function DashboardPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authenticated, user, getUserSurveys } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated) {
      navigate('/');
      return;
    }

    loadSurveys();
  }, [authenticated, navigate]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await getUserSurveys();
      setSurveys(data.surveys || []);
    } catch (error) {
      console.error('加载问卷列表失败:', error);
      toast({
        title: "错误",
        description: "加载问卷列表失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的问卷</h1>
          <p className="text-muted-foreground mt-2">
            欢迎回来，{user?.name}！管理您创建的所有问卷。
          </p>
        </div>
        <Button asChild>
          <Link to="/create">创建新问卷</Link>
        </Button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">加载中...</div>
        </div>
      )}

      {/* 问卷列表 */}
      {!loading && (
        <div className="space-y-4">
          {surveys.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">还没有创建问卷</h3>
              <p className="text-muted-foreground mt-2">
                点击上方按钮开始创建您的第一个问卷
              </p>
              <Button asChild className="mt-4">
                <Link to="/create">创建问卷</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {surveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onUpdate={loadSurveys}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 问卷卡片组件
function SurveyCard({ survey, onUpdate }) {
  const { toast } = useToast();

  const copyLink = (surveyId) => {
    const url = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "成功",
        description: "问卷链接已复制到剪贴板",
      });
    });
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg truncate">
            {survey.title || '未命名问卷'}
          </h3>
          <p className="text-sm text-muted-foreground">
            创建于 {formatDate(survey.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link to={`/survey/${survey.id}`}>预览</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyLink(survey.id)}
          >
            复制链接
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/results/${survey.id}`}>查看结果</Link>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          ID: {survey.id}
        </div>
      </div>
    </div>
  );
}

// 格式化日期的辅助函数
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default DashboardPage;