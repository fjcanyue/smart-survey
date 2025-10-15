import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Copy, BarChart2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

function DashboardPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { authenticated, user, getUserSurveys, deleteSurvey } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadSurveys = useCallback(async () => {
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
  }, [getUserSurveys, toast]);

  useEffect(() => {
    if (!authenticated) {
      navigate('/');
      return;
    }

    loadSurveys();
  }, [authenticated, navigate, loadSurveys]);

  const handleEditSurvey = (surveyId) => {
    navigate(`/create?id=${surveyId}`);
  };

  const handleDeleteSurvey = async (surveyId) => {
    const confirmed = window.confirm('确定要删除该问卷吗？此操作无法撤销。');
    if (!confirmed) return;

    try {
      setDeletingId(surveyId);
      await deleteSurvey(surveyId);
      toast({
        title: "已删除",
        description: "问卷已成功删除",
      });
      await loadSurveys();
    } catch (error) {
      console.error('删除问卷失败:', error);
      toast({
        title: "删除失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
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
                  onEdit={handleEditSurvey}
                  onDelete={handleDeleteSurvey}
                  deletingId={deletingId}
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
function SurveyCard({ survey, onEdit, onDelete, deletingId }) {
  const { toast } = useToast();
  const isDeleting = deletingId === survey.id;

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

        <div className="flex flex-wrap gap-1">
          <IconTooltip label="预览">
            <Button size="icon" variant="ghost" asChild aria-label="预览">
              <Link to={`/survey/${survey.id}`}><Eye className="h-4 w-4" /></Link>
            </Button>
          </IconTooltip>
          <IconTooltip label="复制链接">
            <Button size="icon" variant="ghost" onClick={() => copyLink(survey.id)} aria-label="复制链接">
              <Copy className="h-4 w-4" />
            </Button>
          </IconTooltip>
          <IconTooltip label="查看结果">
            <Button size="icon" variant="ghost" asChild aria-label="查看结果">
              <Link to={`/results/${survey.id}`}><BarChart2 className="h-4 w-4" /></Link>
            </Button>
          </IconTooltip>
          <IconTooltip label="编辑">
            <Button size="icon" variant="ghost" onClick={() => onEdit?.(survey.id)} aria-label="编辑">
              <Pencil className="h-4 w-4" />
            </Button>
          </IconTooltip>
          <IconTooltip label={isDeleting ? '删除中' : '删除'}>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => onDelete?.(survey.id)}
              disabled={isDeleting}
              aria-label={isDeleting ? '删除中' : '删除'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </IconTooltip>
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

function IconTooltip({ label, children }) {
  return (
    <div className="relative group">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}