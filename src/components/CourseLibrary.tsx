import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  PlayCircle,
  Lock,
  BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';
import { Course } from '../types';
import { useSearchParams } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { levelLabel } from '../lib/utils';

const productTypeLabels: Record<string, string> = {
  course: '课程',
  training: '培训',
  certification: '认证',
};

function inferProductType(course: Course) {
  if (course.productType) return course.productType;
  const title = `${course.title} ${course.category}`.toLowerCase();
  if (title.includes('认证')) return 'certification';
  if (title.includes('培训') || title.includes('训练营')) return 'training';
  return 'course';
}

function formatPrice(price?: number) {
  if (!price) return '免费';
  return `¥${price.toLocaleString('zh-CN')}`;
}

export default function CourseLibrary() {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const refreshCourses = async () => {
    const response = await apiService.getCourses();
    setCourses(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        await refreshCourses();
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('获取课程列表失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleStartLearning = async (course: Course) => {
    if (course.isAccessible === false) {
      toast.error(course.accessReason || '未解锁');
      return;
    }
    try {
      if (!course.isEnrolled) {
        setEnrollingId(course.id);
        await apiService.enrollCourse(course.id);
        toast.success('选课成功');
        await refreshCourses();
      }
      const lessonId = course.lastLessonId || course.modules?.[0]?.id || 'intro';
      navigate(`/courses/${course.id}/learn/${lessonId}`);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        const lessonId = course.lastLessonId || course.modules?.[0]?.id || 'intro';
        navigate(`/courses/${course.id}/learn/${lessonId}`);
        return;
      }
      toast.error(error?.response?.data?.error || '选课失败');
    } finally {
      setEnrollingId(null);
    }
  };

  const accessibleCourses = useMemo(
    () => courses.filter((course) => course.isAccessible !== false),
    [courses]
  );
  const lockedCourses = useMemo(
    () => courses.filter((course) => course.isAccessible === false),
    [courses]
  );
  const filteredCourses = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const visibleCourses = [...accessibleCourses, ...lockedCourses];
    if (!keyword) return visibleCourses;
    return visibleCourses.filter((course) =>
      [course.title, course.instructor, course.category, course.level]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [accessibleCourses, lockedCourses, query]);

  const featuredCourse = accessibleCourses[0] || filteredCourses[0];

  if (isLoading) {
    return (
      <div className="edu-page flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="edu-page">
      <div className="edu-shell">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="edu-title">课程中心</h1>
            <p className="edu-subtitle mt-0.5">
              可学 {accessibleCourses.length} 门
              {user?.role === 'student' ? ` · ${levelLabel(user?.membershipLevel)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 edu-card px-3 py-2 w-full lg:w-[300px]">
            <Search className="w-3.5 h-3.5 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                const next = value.trim();
                if (next) setSearchParams({ q: next }, { replace: true });
                else setSearchParams({}, { replace: true });
              }}
              placeholder="搜索课程"
              className="w-full bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-muted"
            />
          </div>
        </div>

        {featuredCourse && (
          <section className="edu-card p-3">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2 aspect-[16/9] lg:aspect-auto lg:min-h-[200px] rounded-[12px] overflow-hidden bg-surface-alt">
                {featuredCourse.image ? (
                  <img src={featuredCourse.image} alt={featuredCourse.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">封面</div>
                )}
              </div>
              <div className="lg:col-span-3 p-2 sm:p-3 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="edu-chip-blue"><BadgeCheck className="w-3 h-3" />{levelLabel(featuredCourse.level)}</span>
                    <span className="edu-chip-slate">{productTypeLabels[inferProductType(featuredCourse)]}</span>
                    {featuredCourse.isEnrolled && <span className="edu-chip-green">{featuredCourse.progress ?? 0}%</span>}
                    {featuredCourse.hasVideo === false && <span className="edu-chip-amber">暂无视频</span>}
                  </div>
                  <h2 className="text-[18px] font-semibold tracking-tight text-ink leading-snug">{featuredCourse.title}</h2>
                  {featuredCourse.description ? (
                    <p className="text-[12px] text-ink-muted line-clamp-2">{featuredCourse.description}</p>
                  ) : null}
                  <p className="text-[11px] text-ink-muted">
                    {featuredCourse.category || '课程'} · {featuredCourse.duration || '--'} · {formatPrice(featuredCourse.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/courses/${featuredCourse.id}`)} className="edu-btn-secondary">详情</button>
                  <button
                    onClick={() => handleStartLearning(featuredCourse)}
                    className="edu-btn-primary"
                    disabled={enrollingId === featuredCourse.id}
                  >
                    {featuredCourse.isEnrolled ? '继续' : enrollingId === featuredCourse.id ? '...' : '开始'}
                    <PlayCircle className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredCourses.map((course) => {
            const locked = course.isAccessible === false;
            return (
              <article key={course.id} className="edu-card overflow-hidden">
                <div className="aspect-[16/9] bg-surface-alt relative">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.title}
                      className={`w-full h-full object-cover ${locked ? 'opacity-70' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">暂无封面</div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-1">
                    <span className="edu-chip-blue bg-white/95">{levelLabel(course.level)}</span>
                  </div>
                  {locked && (
                    <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center">
                      <span className="edu-chip-amber bg-white"><Lock className="w-3 h-3" />未解锁</span>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-semibold text-ink leading-snug line-clamp-2">{course.title}</h3>
                    <span className="text-[12px] font-semibold text-ink shrink-0">{formatPrice(course.price)}</span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    {course.category || '课程'} · {course.duration || '--'} · {course.instructor || '讲师'}
                  </p>
                  {(course.isEnrolled || (course.progress ?? 0) > 0) && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-ink-muted">
                        <span>进度</span><span>{course.progress ?? 0}%</span>
                      </div>
                      <div className="edu-progress"><span style={{ width: `${course.progress ?? 0}%` }} /></div>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => locked ? toast.error(course.accessReason || '未解锁') : navigate(`/courses/${course.id}`)}
                      className="edu-btn-secondary flex-1 !py-1.5"
                    >
                      {locked ? '权限' : '详情'}
                    </button>
                    <button
                      onClick={() => handleStartLearning(course)}
                      className="edu-btn-primary flex-1 !py-1.5"
                      disabled={locked || enrollingId === course.id}
                    >
                      {locked ? '未解锁' : course.isEnrolled ? '继续' : enrollingId === course.id ? '...' : '开始'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {!filteredCourses.length && <div className="edu-empty">暂无课程</div>}
      </div>
    </div>
  );
}
