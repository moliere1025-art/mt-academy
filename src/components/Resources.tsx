import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Code,
  Table,
  Archive,
  Play,
  Download,
  Search,
  Calendar,
  BookOpen,
  FolderOpen,
} from 'lucide-react';
import SpotlightCard from './animations/SpotlightCard';
import Button from './ui/Button';
import { useNavigation } from '../contexts/NavigationContext';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';
import { Resource } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { levelLabel } from '../lib/utils';

const typeLabels = {
  pdf: '课件 PDF',
  code: '代码资料',
  excel: '数据表格',
  zip: '打包附件',
  video: '视频资料',
  document: '文档',
} as const;

function inferResourceType(url: string): Resource['type'] {
  const normalized = url.toLowerCase();
  if (normalized.endsWith('.pdf')) return 'pdf';
  if (normalized.endsWith('.zip') || normalized.endsWith('.rar') || normalized.endsWith('.7z')) return 'zip';
  if (normalized.endsWith('.xls') || normalized.endsWith('.xlsx') || normalized.endsWith('.csv')) return 'excel';
  if (normalized.endsWith('.doc') || normalized.endsWith('.docx') || normalized.endsWith('.txt')) return 'document';
  if (normalized.endsWith('.mp4') || normalized.endsWith('.mov') || normalized.endsWith('.webm') || normalized.endsWith('.m3u8')) return 'video';
  if (normalized.endsWith('.js') || normalized.endsWith('.ts') || normalized.endsWith('.jsx') || normalized.endsWith('.tsx') || normalized.endsWith('.py') || normalized.endsWith('.json')) return 'code';
  return 'document';
}

function getFileNameFromUrl(url: string, fallback: string) {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const segment = pathname.split('/').filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : fallback;
  } catch {
    return fallback;
  }
}

export default function Resources() {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await apiService.getResources();
        const data = Array.isArray(response.data) ? response.data : [];
        setResources(data);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        toast.error('获取学习资料失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);

  const visibleResources = useMemo(
    () => resources.filter((resource) => resource.isAccessible !== false),
    [resources]
  );

  const lockedResourceCount = useMemo(
    () => resources.filter((resource) => resource.isAccessible === false).length,
    [resources]
  );

  const filteredResources = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return visibleResources;

    return visibleResources.filter((resource) =>
      [resource.name, resource.type, resource.date, resource.size, resource.courseTitle, resource.lessonTitle]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [query, visibleResources]);

  const stats = useMemo(() => ({
    total: filteredResources.length,
    pdfs: filteredResources.filter((resource) => resource.type === 'pdf').length,
    videos: filteredResources.filter((resource) => resource.type === 'video').length,
  }), [filteredResources]);

  const handleResourceAction = (resource: Resource) => {
    if (!resource.url) {
      toast.error('暂无链接');
      return;
    }

    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="edu-page flex items-center justify-center min-h-[70vh]">
        <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="edu-page">
      <div className="edu-shell">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-5 max-w-3xl">
            <div><h1 className="edu-title">学习资料</h1></div>
          </div>

          <div className="w-full xl:w-[420px] space-y-4">
            <div className="flex items-center gap-3 edu-card px-3 py-2">
              <Search className="w-4 h-4 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="搜索资料名称、课程或章节..."
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-ink placeholder:text-ink-muted"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="edu-stat">
                <p className="edu-stat-label">全部</p>
                <p className="text-2xl font-semibold tracking-tight text-ink">{stats.total}</p>
              </div>
              <div className="edu-stat">
                <p className="edu-stat-label">PDF</p>
                <p className="text-2xl font-semibold tracking-tight text-ink">{stats.pdfs}</p>
              </div>
              <div className="edu-stat">
                <p className="edu-stat-label">视频</p>
                <p className="text-2xl font-semibold tracking-tight text-ink">{stats.videos}</p>
              </div>
            </div>
          </div>
        </div>

        {!!filteredResources.length && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredResources.map((resource) => (
              <SpotlightCard
                key={resource.id}
                className="p-3.5 flex flex-col gap-3 edu-card hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="w-9 h-9 bg-blue-50 rounded-2xl flex items-center justify-center text-primary border border-blue-100 group-hover:bg-primary group-hover:text-white transition-all duration-300 dark:bg-blue-500/10 dark:border-blue-500/20">
                    {resource.type === 'pdf' && <FileText className="w-7 h-7" />}
                    {resource.type === 'code' && <Code className="w-7 h-7" />}
                    {resource.type === 'excel' && <Table className="w-7 h-7" />}
                    {resource.type === 'zip' && <Archive className="w-7 h-7" />}
                    {resource.type === 'video' && <Play className="w-7 h-7" />}
                    {resource.type === 'document' && <BookOpen className="w-7 h-7" />}
                  </div>
                  <button
                    onClick={() => handleResourceAction(resource)}
                    className="w-10 h-10 rounded-full border border-outline bg-surface-alt text-ink-muted hover:text-ink hover:bg-surface transition-colors flex items-center justify-center"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-primary">
                    {typeLabels[resource.type]}
                  </p>
                  <h3 className="font-semibold text-ink text-[14px] font-display tracking-tight leading-snug break-words">
                    {resource.name}
                  </h3>
                  <div className="space-y-2 text-xs font-medium text-ink-muted">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{resource.courseTitle || '未归属课程'}</span>
                    </div>
                    {!!resource.lessonTitle && (
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>{resource.lessonTitle}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{resource.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{resource.date}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleResourceAction(resource)}
                  variant="secondary"
                  size="lg"
                  className="w-full rounded-full border border-outline bg-surface-alt text-ink hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                >
                  打开资料
                </Button>
              </SpotlightCard>
            ))}
          </div>
        )}

        {!filteredResources.length && (
          <div className="bg-surface border border-dashed border-outline rounded-[18px] p-16 text-center text-ink-muted font-medium space-y-4">
            <BookOpen className="w-10 h-10 mx-auto text-ink-muted" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-ink">当前还没有可用学习资料</p>
              <p>请先在课程管理中上传课程视频或 PDF，资料中心会自动同步显示。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
