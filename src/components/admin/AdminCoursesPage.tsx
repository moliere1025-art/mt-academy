import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { apiService } from '../../services/apiService';
import { Course } from '../../types';
import { AdminLoadingCard, EmptyState, AdminPageHero } from './shared';

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const filteredCourses = courses.filter((course) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return [course.title, course.instructor, course.category, course.level]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiService.getCourses();
        setCourses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error('获取课程列表失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiService.deleteCourse(deleteTarget.id);
      setCourses((current) => current.filter((course) => course.id !== deleteTarget.id));
      toast.success(`课程“${deleteTarget.title}”已删除`);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || '删除课程失败');
    }
  };

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 md:px-10 py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <AdminPageHero
          eyebrow="课程管理"
          title="课程列表与管理"
          primary={{ label: '添加课程', action: () => navigate('/admin/courses/new') }}
          secondary={{ label: '查看学生', action: () => navigate('/admin/students') }}
        />

        <div className="flex items-center gap-3 bg-surface border border-outline rounded-2xl px-5 py-3 max-w-md">
          <Search className="w-4 h-4 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              const next = value.trim();
              if (next) setSearchParams({ q: next }, { replace: true });
              else setSearchParams({}, { replace: true });
            }}
            placeholder="搜索课程..."
            className="w-full bg-transparent outline-none text-sm font-medium text-ink placeholder:text-ink-muted"
          />
        </div>

        {isLoading ? (
          <AdminLoadingCard label="正在加载课程列表..." />
        ) : (
          <>
            {/* ── 桌面端表格 ── */}
            <div className="hidden lg:block bg-surface border border-outline rounded-[18px] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-outline bg-surface-alt text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                <div className="col-span-4">课程</div>
                <div className="col-span-2">分类</div>
                <div className="col-span-2">难度</div>
                <div className="col-span-2">时长</div>
                <div className="col-span-2 text-right">操作</div>
              </div>

              <div className="divide-y divide-outline">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center">
                    <div className="col-span-4">
                      <p className="text-base font-bold tracking-tight font-display text-ink">{course.title}</p>
                      <p className="text-sm text-ink-muted font-medium">{course.instructor}</p>
                    </div>
                    <div className="col-span-2 text-sm font-bold text-ink-muted">{course.category || '课程'}</div>
                    <div className="col-span-2 text-sm font-bold text-ink-muted">{course.level || '等级'}</div>
                    <div className="col-span-2 text-sm font-bold text-ink-muted">{course.duration || '--'}</div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button onClick={() => navigate(`/admin/courses/${course.id}`)} variant="secondary" className="rounded-full px-5">
                        编辑
                      </Button>
                      <Button onClick={() => setDeleteTarget(course)} variant="ghost" className="rounded-full px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!filteredCourses.length && <div className="px-8 py-16"><EmptyState text="暂无课程" /></div>}
              </div>
            </div>

            {/* ── 移动端卡片 ── */}
            <div className="lg:hidden space-y-3">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-surface border border-outline rounded-[18px] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold tracking-tight font-display text-ink truncate">{course.title}</p>
                      <p className="text-sm text-ink-muted font-medium">{course.instructor}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button onClick={() => navigate(`/admin/courses/${course.id}`)} variant="secondary" className="rounded-full px-3 py-2 text-sm">
                        编辑
                      </Button>
                      <Button onClick={() => setDeleteTarget(course)} variant="ghost" className="rounded-full px-2 py-2 text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-ink-muted font-medium">
                    <span>{course.category || '课程'}</span>
                    <span>·</span>
                    <span>{course.level || '等级'}</span>
                    <span>·</span>
                    <span>{course.duration || '--'}</span>
                  </div>
                </div>
              ))}
              {!filteredCourses.length && <div className="py-16"><EmptyState text="暂无课程" /></div>}
            </div>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="删除课程">
              {deleteTarget && (
                <div className="space-y-6 p-2">
                  <p className="text-sm text-ink-muted leading-relaxed font-medium">
                    你将删除课程 <span className="font-bold text-ink">{deleteTarget.title}</span>。这个操作会影响学生端课程展示，请确认后继续。
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setDeleteTarget(null)} variant="secondary" className="flex-1 rounded-full">
                      取消
                    </Button>
                    <Button onClick={handleDelete} variant="primary" className="flex-1 rounded-full bg-red-600 hover:bg-red-500 border-red-600">
                      确认删除
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </>
        )}
      </div>
    </div>
  );
}
