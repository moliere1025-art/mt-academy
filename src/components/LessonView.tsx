import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  Maximize,
  CheckCircle2,
  FileText,
  Clock,
  BookOpen,
  ArrowRight,
  Shield,
  FolderOpen,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { cn, levelLabel } from '../lib/utils';
import Button from './ui/Button';
import { useNavigation } from '../contexts/NavigationContext';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';
import { Course, LessonModule } from '../types';
import { useAuth } from '../contexts/AuthContext';

const LazyPlayer = lazy(async () => {
  const module = await import('react-player');
  return { default: module.default as React.ComponentType<any> };
});

interface LessonItem {
  id: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  resourceCount?: number;
}

export default function LessonView() {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const { courseId, lessonId } = useParams();
  const playerRef = useRef<any>(null);
  const isMounted = useRef(true);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [note, setNote] = useState('');
  const lastToggleTime = useRef(0);

  const isLocked = course?.isAccessible === false;

  useEffect(() => {
    isMounted.current = true;

    const fetchCourseData = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiService.getCourse(courseId);
        if (!isMounted.current) return;

        const foundCourse = response.data || null;

        if (!foundCourse) {
          toast.error('未找到对应课程');
          setIsLoading(false);
          return;
        }

        setCourse(foundCourse);

        const mappedLessons: LessonItem[] = foundCourse.modules?.length
          ? foundCourse.modules.map((module: LessonModule, index) => ({
              id: String(module.id || `lesson-${index + 1}`),
              title: module.title,
              duration: module.duration || '15:00',
              videoUrl: module.videoUrl || foundCourse.videoUrl,
              resourceCount: module.resourceCount || (module.videoUrl ? 1 : 0),
            }))
          : [
              {
                id: 'intro',
                title: foundCourse.title,
                duration: foundCourse.duration || '45:00',
                videoUrl: foundCourse.videoUrl,
                resourceCount: foundCourse.pdfUrl ? 1 : 0,
              },
            ];

        setLessons(mappedLessons);
        const preferredLesson =
          (lessonId && mappedLessons.some((item) => item.id === lessonId) && lessonId)
          || foundCourse.lastLessonId
          || mappedLessons[0]?.id
          || 'intro';
        setActiveLessonId(preferredLesson);

        // Auto-enroll when opening a learnable course
        if (foundCourse.isAccessible !== false && !foundCourse.isEnrolled) {
          try {
            await apiService.enrollCourse(foundCourse.id);
          } catch (error: any) {
            if (error?.response?.status !== 409) {
              console.warn('Auto enroll skipped', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch course data:', error);
        toast.error('获取课程详情失败');
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    fetchCourseData();

    return () => {
      isMounted.current = false;
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      setPlaying(false);
    };
  }, [courseId, lessonId]);

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0],
    [lessons, activeLessonId]
  );

  const progressPercent = Math.round(played * 100);
  const noteStorageKey = course ? `lesson-note-${course.id}-${activeLesson?.id || 'intro'}` : '';
  const availableResources = useMemo(() => {
    if (!course) return [] as Array<{ label: string; url: string; type: string }>;

    const resources: Array<{ label: string; url: string; type: string }> = [];
    if (course.pdfUrl) {
      resources.push({ label: '课程 PDF 课件', url: course.pdfUrl, type: 'pdf' });
    }
    if (activeLesson?.videoUrl) {
      resources.push({ label: `当前章节视频：${activeLesson.title}`, url: activeLesson.videoUrl, type: 'video' });
    }
    return resources;
  }, [course, activeLesson]);

  useEffect(() => {
    if (!noteStorageKey) {
      setNote('');
      return;
    }

    try {
      setNote(localStorage.getItem(noteStorageKey) || '');
    } catch {
      setNote('');
    }
  }, [noteStorageKey]);

  useEffect(() => {
    if (activeLesson?.videoUrl && !isLocked) {
      setIsPlayerVisible(true);
      return;
    }

    setIsPlayerVisible(false);
    setIsReady(true);
  }, [activeLesson?.videoUrl, isLocked]);

  const handlePlayPause = () => {
    if (!isReady || isLocked) return;
    const now = Date.now();
    if (now - lastToggleTime.current < 300) return;
    lastToggleTime.current = now;
    setPlaying(!playing);
  };

  const handleProgress = (state: any) => {
    if (!seeking) setPlayed(state.played);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => setSeeking(true);

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value));
    }
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    return `${mm}:${ss}`;
  };

  const persistProgress = async (lessonIdValue: string, lessonsList: LessonItem[] = lessons) => {
    if (!courseId || isLocked) return;
    const index = Math.max(0, lessonsList.findIndex((item) => item.id === lessonIdValue));
    const progress = lessonsList.length
      ? Math.min(100, Math.round(((index + 1) / lessonsList.length) * 100))
      : 0;
    try {
      await apiService.updateProgress(courseId, {
        progress,
        lastLessonId: lessonIdValue,
      });
    } catch (error) {
      console.warn('Failed to update progress', error);
    }
  };

  useEffect(() => {
    if (!activeLessonId || !courseId || isLocked || !lessons.length) return;
    void persistProgress(activeLessonId, lessons);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonId, courseId, isLocked, lessons.length]);

  const selectLesson = (id: string) => {
    if (isLocked) {
      toast.error(course?.accessReason || `当前账号仅可学习 ${levelLabel(user?.membershipLevel)} 及以下内容`);
      return;
    }

    setPlaying(false);
    setIsReady(false);
    setPlayed(0);
    setDuration(0);
    setShouldAutoPlay(true);
    setActiveLessonId(id);
    navigate(`/courses/${courseId}/learn/${id}`);
    void persistProgress(id);
  };

  const openResource = (url?: string) => {
    if (isLocked) {
      toast.error(course?.accessReason || `当前账号仅可学习 ${levelLabel(user?.membershipLevel)} 及以下内容`);
      return;
    }
    if (!url) {
      toast.error('当前还没有可打开的资料');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const activeLessonIndex = Math.max(0, lessons.findIndex((item) => item.id === activeLessonId));
  const courseProgress = lessons.length
    ? Math.min(100, Math.round(((activeLessonIndex + 1) / lessons.length) * 100))
    : 0;

  if (isLoading) {
    return (
      <div className="edu-page flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="edu-page flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
        <h2 className="text-lg font-semibold text-ink">课程内容暂不可用</h2>
        <Button onClick={() => navigate('/courses')} variant="primary" className="rounded-full">
          返回课程中心
        </Button>
      </div>
    );
  }

  return (
    <div className="edu-page">
      <div className="edu-shell">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button onClick={() => navigate('/courses')} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted hover:text-primary">
            <ChevronLeft className="w-4 h-4" />
            课程中心
          </button>
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-muted">
            <span className="edu-chip-blue">{course.category || '课程'}</span>
            <span className="edu-chip-slate">{levelLabel(course.level)}</span>
            <span className="edu-chip-slate">{lessons.length} 章节</span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-ink">{course.title}</h1>
            <p className="text-[12px] text-ink-muted mt-0.5">
              {course.instructor || '讲师'} · 当前：{activeLesson.title}
            </p>
          </div>
          <div className="text-[12px] text-ink-muted">
            课程进度 {courseProgress}% · 播放 {progressPercent}%
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4" ref={containerRef}>
            <div className="edu-card p-3 overflow-hidden">
              <div className="aspect-video bg-black rounded-[12px] overflow-hidden relative group">
                <Suspense
                  fallback={
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                      <div className="text-center space-y-3">
                        <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">加载播放器</p>
                      </div>
                    </div>
                  }
                >
                  {isLocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-950 to-black text-white">
                      <div className="text-center space-y-4 px-8 max-w-md">
                        <Shield className="w-10 h-10 mx-auto text-amber-300" />
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">课程已锁定</p>
                          <p className="text-sm font-medium text-white/80">未解锁</p>
                        </div>
                      </div>
                    </div>
                  ) : isPlayerVisible && activeLesson.videoUrl ? (
                    <LazyPlayer
                      ref={playerRef}
                      url={activeLesson.videoUrl}
                      width="100%"
                      height="100%"
                      playing={playing}
                      volume={volume}
                      onProgress={handleProgress}
                      playsinline
                      onReady={() => {
                        if (!isMounted.current) return;
                        setIsReady(true);
                        if (playerRef.current) {
                          try {
                            setDuration(playerRef.current.getDuration());
                          } catch {}
                        }
                        if (shouldAutoPlay) {
                          if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
                          playTimeoutRef.current = setTimeout(() => {
                            if (isMounted.current) {
                              setPlaying(true);
                              setShouldAutoPlay(false);
                            }
                          }, 100);
                        }
                      }}
                      onError={() => {
                        toast.error('视频加载失败，请检查链接或网络');
                        setIsReady(true);
                      }}
                      onEnded={() => setPlaying(false)}
                      config={{
                        youtube: { rel: 0 },
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                      <div className="text-center space-y-4 px-6">
                        <BookOpen className="w-8 h-8 mx-auto text-white/60" />
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">章节预览</p>
                          <p className="text-sm font-medium text-white/80">暂无视频</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Suspense>

                {!isLocked && (
                  <div className={cn('absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-500 flex flex-col justify-between p-6', playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100')}>
                    <div className="flex justify-between items-start">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
                        <p className="text-white text-xs font-semibold">{activeLesson.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePlayPause} className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 cursor-pointer border border-white/10">
                        {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                      </motion.button>
                    </div>

                    <div className="space-y-4">
                      <div className="relative h-1.5 w-full">
                        <input type="range" min={0} max={0.999999} step="any" value={played} onMouseDown={handleSeekMouseDown} onChange={handleSeekChange} onMouseUp={handleSeekMouseUp} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="absolute inset-0 bg-surface/10 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-primary transition-all duration-100" style={{ width: `${played * 100}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-surface rounded-full shadow-lg"></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-white gap-4">
                        <div className="flex items-center gap-5 flex-wrap">
                          <button onClick={handlePlayPause} className="hover:text-primary transition-colors">
                            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                          </button>
                          <div className="flex items-center gap-3">
                            <Volume2 className="w-4 h-4" />
                            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-surface/10 rounded-full appearance-none cursor-pointer accent-primary" />
                          </div>
                          <span className="text-[10px] font-bold tracking-widest text-white/70">
                            {formatTime(played * duration)} / {formatTime(duration)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (containerRef.current) {
                              if (document.fullscreenElement) document.exitFullscreen();
                              else containerRef.current.requestFullscreen();
                            }
                          }}
                          className="hover:text-primary transition-colors"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="edu-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="edu-section-title">本节笔记</h2>
                <Button
                  onClick={() => {
                    toast.success('笔记已保存');
                    try {
                      if (noteStorageKey) localStorage.setItem(noteStorageKey, note);
                    } catch {}
                  }}
                  variant="secondary"
                  className="rounded-full h-8 text-xs px-3"
                >
                  保存
                </Button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full min-h-[120px] rounded-[12px] border border-outline bg-surface-alt p-3 text-[13px] text-ink resize-none outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="记录重点..."
              />
              {course.description ? (
                <p className="text-[12px] text-ink-muted leading-relaxed line-clamp-3">{course.description}</p>
              ) : null}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-3">
            <section className="edu-side-panel">
              <div className="flex items-center justify-between">
                <h2 className="edu-section-title">课程完成度</h2>
                <span className="text-[12px] font-semibold text-primary">{courseProgress}%</span>
              </div>
              <div className="edu-progress"><span style={{ width: `${courseProgress}%` }} /></div>
              <p className="text-[11px] text-ink-muted">{activeLessonIndex + 1}/{lessons.length} 章节</p>
            </section>

            <section className="edu-side-panel max-h-[420px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between sticky top-0 bg-surface pb-2">
                <h2 className="edu-section-title">课程目录</h2>
                <span className="text-[11px] text-ink-muted">{lessons.length}</span>
              </div>
              <div className="space-y-1">
                {lessons.map((lesson, index) => {
                  const isActive = lesson.id === activeLessonId;
                  const done = index < activeLessonIndex;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => selectLesson(lesson.id)}
                      className={cn(
                        'w-full text-left rounded-[10px] px-2.5 py-2 border transition-all',
                        isActive
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-transparent border-transparent hover:bg-surface-alt'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
                          done ? 'bg-emerald-100 text-emerald-700' : isActive ? 'bg-primary text-white' : 'bg-slate-100 text-ink-muted'
                        )}>
                          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-[12px] font-semibold truncate', isActive ? 'text-ink' : 'text-ink')}>{lesson.title}</p>
                          <p className="text-[10px] text-ink-muted mt-0.5">{lesson.duration || '--'}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="edu-side-panel">
              <h2 className="edu-section-title">资料</h2>
              <div className="space-y-1.5">
                {availableResources.length ? availableResources.map((resource) => (
                  <button
                    key={`${resource.type}-${resource.url}`}
                    onClick={() => openResource(resource.url)}
                    className="edu-row w-full text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-ink truncate">{resource.label}</p>
                      <p className="text-[10px] text-ink-muted mt-0.5">{resource.type}</p>
                    </div>
                    <FolderOpen className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                  </button>
                )) : <div className="edu-empty">暂无资料</div>}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => navigate('/assignments')} className="edu-btn-secondary">作业</button>
                <button onClick={() => navigate('/live')} className="edu-btn-secondary">直播</button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
