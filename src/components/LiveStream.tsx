import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Clock,
  Calendar,
  PlayCircle,
  Video,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';
import { LiveSession } from '../types';

export default function LiveStream() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await apiService.getLiveSessions();
        setSessions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch live sessions:', error);
        toast.error('获取直播安排失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const upcomingSessions = useMemo(
    () => sessions.filter((session) => session.status !== 'replay' && !session.replayUrl),
    [sessions]
  );

  const replaySessions = useMemo(
    () => sessions.filter((session) => session.status === 'replay' || !!session.replayUrl),
    [sessions]
  );

  const featuredSession = upcomingSessions[0] || sessions[0] || null;
  const sortedUpcomingSessions = useMemo(
    () => [...upcomingSessions].sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`)),
    [upcomingSessions]
  );
  const sortedReplaySessions = useMemo(
    () => [...replaySessions].sort((a, b) => `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`)),
    [replaySessions]
  );

  if (isLoading) {
    return (
      <div className="edu-page flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="edu-page">
      <div className="edu-shell pb-16">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="space-y-4 max-w-3xl">
            <div><h1 className="edu-title">直播与回放</h1></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full xl:w-auto">
            <div className="edu-stat flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="edu-stat-label">即将直播</p>
                <p className="text-2xl font-bold tracking-tight text-ink">{upcomingSessions.length}</p>
              </div>
            </div>
            <div className="edu-stat flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <PlayCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="edu-stat-label">可回放</p>
                <p className="text-2xl font-bold tracking-tight text-ink">{replaySessions.length}</p>
              </div>
            </div>
            <div className="edu-stat flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="edu-stat-label">当前权限</p>
                <p className="text-sm font-bold tracking-tight text-ink">{user?.name || '学员'} / 已开通</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-3 edu-card overflow-hidden">
            <div className="aspect-[16/9] bg-black text-white p-5 sm:p-8 md:p-10 flex flex-col justify-between gap-4 sm:gap-3">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/70">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {featuredSession ? '下次直播' : '直播安排'}
              </div>

              {featuredSession ? (
                <>
                  <div className="space-y-5 max-w-2xl">
                    <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight font-display leading-snug">
                      {featuredSession.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-white/70">
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{featuredSession.date || '待定日期'}</span>
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{featuredSession.time || '待定时间'}</span>
                      <span className="flex items-center gap-2"><Users className="w-4 h-4" />{featuredSession.instructor || '课程导师'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Button onClick={() => navigate('/courses')} variant="primary" className="rounded-full px-7">
                      进入课程中心
                    </Button>
                    <Button onClick={() => navigate('/resources')} variant="secondary" className="rounded-full px-7 bg-surface/10 text-white border-white/20 hover:bg-surface/20">
                      查看课程资料
                    </Button>
                  </div>
                </>
              ) : (<div className="space-y-4">
                  <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight font-display leading-snug">
                    暂无直播
                  </h2>
                </div>
              )}
            </div>
          </div>
          <div className="xl:col-span-2 space-y-6">
            <div className="edu-card p-4 space-y-3">
              <h3 className="text-xl font-bold tracking-tight font-display text-ink">快捷入口</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/dashboard')} variant="secondary" className="rounded-full px-6">
                  学习首页
                </Button>
                <Button onClick={() => navigate('/assignments')} variant="ghost" className="rounded-full px-6">
                  作业
                </Button>
              </div>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="edu-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="edu-section-title">即将开始</h3>
              <Button onClick={() => navigate('/dashboard')} variant="ghost" className="rounded-full">
                学习首页
              </Button>
            </div>
            <div className="space-y-4">
              {sortedUpcomingSessions.length ? sortedUpcomingSessions.map((session) => (
                <div key={session.id} className="edu-card-soft p-3.5 hover:bg-primary/5 hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-primary mb-2">{session.type || '直播'}</p>
                      <h4 className="text-[14px] font-semibold tracking-tight text-ink">{session.title}</h4>
                    </div>
                    <ArrowRight className="w-5 h-5 text-ink-muted" />
                  </div>
                  <div className="flex flex-wrap gap-5 text-xs font-medium text-ink-muted">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{session.date || '待定日期'}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{session.time || '待定时间'}</span>
                    <span className="flex items-center gap-2"><Users className="w-4 h-4" />{session.instructor || '课程导师'}</span>
                  </div>
                </div>
              )) : (
                <div className="edu-empty">
                  暂无直播
                </div>
              )}
            </div>
          </div>

          <div className="edu-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="edu-section-title">课程回放</h3>
              <Button onClick={() => navigate('/courses')} variant="ghost" className="rounded-full">
                进入课程
              </Button>
            </div>
            <div className="space-y-4">
              {sortedReplaySessions.length ? sortedReplaySessions.map((session) => (
                <div key={session.id} className="edu-card-soft p-3.5 hover:bg-primary/5 hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-primary mb-2">{session.type || '回放'}</p>
                      <h4 className="text-[14px] font-semibold tracking-tight text-ink">{session.title}</h4>
                    </div>
                    <PlayCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-wrap gap-5 text-xs font-medium text-ink-muted">
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" />可回放</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{session.date || '已录制'}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button
                      onClick={() => window.open(session.replayUrl, '_blank', 'noopener,noreferrer')}
                      variant="primary"
                      className="rounded-full px-6"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      播放回放
                    </Button>
                    <Button onClick={() => navigate('/courses')} variant="secondary" className="rounded-full px-6">
                      对应课程
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="rounded-[18px] border border-dashed border-outline bg-surface p-10 text-center text-ink-muted font-medium">
                  当前还没有课程回放。
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
