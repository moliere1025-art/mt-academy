import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  ArrowRight,
  Clock,
  FileText,
  BookOpen,
  Video,
  Calendar,
} from 'lucide-react';
import Button from './ui/Button';
import { useNavigation } from '../contexts/NavigationContext';
import { toast } from 'sonner';
import { apiService, SubmissionRecord, DashboardStats, EnrollmentRecord } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Assignment, Course, LiveSession } from '../types';
import { levelLabel } from '../lib/utils';

export default function Dashboard() {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [coursesRes, liveRes, assignmentsRes, submissionsRes, enrollRes, statsRes] = await Promise.all([
          apiService.getCourses(),
          apiService.getLiveSessions(),
          apiService.getAssignments(),
          apiService.getSubmissions(),
          apiService.getEnrollments(),
          apiService.getDashboardStats(),
        ]);

        const assignmentList = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
        const submissions = Array.isArray(submissionsRes.data) ? submissionsRes.data : [];
        const submissionMap = new Map<string, SubmissionRecord>(
          submissions.map((submission) => [submission.assignmentId, submission])
        );

        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setEnrollments(Array.isArray(enrollRes.data) ? enrollRes.data : []);
        setLiveSessions(Array.isArray(liveRes.data) ? liveRes.data : []);
        setStats(statsRes.data && typeof statsRes.data === 'object' ? statsRes.data : null);
        setAssignments(
          assignmentList.map((assignment) => {
            const submission = submissionMap.get(assignment.id);
            return {
              ...assignment,
              status: submission?.grade ? 'graded' : submission ? 'pending' : assignment.status || 'not_submitted',
              submittedAt: submission?.submittedAt || assignment.submittedAt,
              feedback: submission?.feedback || assignment.feedback,
              score: submission?.grade || assignment.score,
            };
          })
        );
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        toast.error('获取学习首页数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const availableCourses = useMemo(
    () => courses.filter((course) => course.isAccessible !== false),
    [courses]
  );

  const enrolledCourses = useMemo(() => {
    if (!enrollments.length) {
      return availableCourses.filter((course) => course.isEnrolled || (course.progress || 0) > 0);
    }
    const byId = new Map(courses.map((course) => [course.id, course]));
    return enrollments
      .map((enrollment) => {
        const course = byId.get(enrollment.courseId);
        if (!course) {
          return {
            id: enrollment.courseId,
            title: enrollment.courseTitle || '课程',
            instructor: enrollment.instructor || '',
            level: enrollment.level || 'Core',
            duration: enrollment.duration || '',
            students: 0,
            image: enrollment.courseImage || '',
            category: '课程',
            progress: enrollment.progress,
            lastLessonId: enrollment.lastLessonId,
            isEnrolled: true,
            isAccessible: true,
            modules: [],
          } as Course;
        }
        return {
          ...course,
          progress: enrollment.progress,
          lastLessonId: enrollment.lastLessonId,
          isEnrolled: true,
        };
      })
      .filter((course) => course.isAccessible !== false);
  }, [availableCourses, courses, enrollments]);

  const continueCourse = useMemo(() => {
    return [...enrolledCourses].sort((a, b) => (b.progress || 0) - (a.progress || 0))[0]
      || [...availableCourses].sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];
  }, [availableCourses, enrolledCourses]);

  const continueLessonId = continueCourse?.lastLessonId || continueCourse?.modules?.[0]?.id || 'intro';

  const sortedLiveSessions = useMemo(
    () => [...liveSessions].sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`)),
    [liveSessions]
  );

  const upcomingLive = sortedLiveSessions.find((session) => session.status !== 'replay' && !session.replayUrl) || null;
  const todoAssignments = assignments
    .filter((a) => a.status !== 'graded')
    .slice(0, 5);
  const courseList = (enrolledCourses.length ? enrolledCourses : availableCourses).slice(0, 6);

  const enrolledCount = stats?.enrolledCourses ?? enrolledCourses.length;
  const pendingCount = stats?.pendingAssignments
    ?? assignments.filter((item) => item.status === 'pending' || item.status === 'not_submitted' || !item.status).length;
  const liveCount = stats?.upcomingLive ?? liveSessions.filter((s) => s.status === 'upcoming' || (!s.replayUrl && s.status !== 'ended')).length;
  const averageProgress = stats?.averageProgress
    ?? (enrolledCourses.length
      ? Math.round(enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / enrolledCourses.length)
      : 0);

  if (isLoading) {
    return (
      <div className="edu-page flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusLabel = (status?: string) => {
    if (status === 'graded') return '已评分';
    if (status === 'pending') return '待批改';
    return '未提交';
  };

  return (
    <div className="edu-page">
      <div className="edu-shell">
        {/* Header + KPI row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="edu-title">你好，{user?.name || '同学'}</h1>
            <p className="edu-subtitle mt-0.5">{levelLabel(user?.membershipLevel)} · 今日学习工作台</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(continueCourse ? `/courses/${continueCourse.id}/learn/${continueLessonId}` : '/courses')}
              className="edu-btn-primary"
            >
              继续学习 <Play className="w-3.5 h-3.5 ml-1.5 fill-current" />
            </button>
            <button onClick={() => navigate('/assignments')} className="edu-btn-secondary">作业</button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: '已选课程', value: enrolledCount },
            { label: '待完成作业', value: pendingCount },
            { label: '直播安排', value: liveCount },
            { label: '平均进度', value: `${averageProgress}%` },
          ].map((item) => (
            <div key={item.label} className="edu-stat">
              <p className="edu-stat-label">{item.label}</p>
              <p className="edu-stat-value">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Main workbench: content + right rail — fill full main width */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            {/* Continue learning compact */}
            <section className="edu-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="edu-section-title">继续学习</h2>
                <Button onClick={() => navigate('/courses')} variant="ghost" className="rounded-full h-8 text-xs">全部课程</Button>
              </div>
              {continueCourse ? (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2 aspect-[16/10] sm:aspect-auto sm:min-h-[140px] rounded-[12px] overflow-hidden bg-surface-alt border border-outline">
                    {continueCourse.image ? (
                      <img src={continueCourse.image} alt={continueCourse.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">封面</div>
                    )}
                  </div>
                  <div className="sm:col-span-3 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="edu-chip-blue">{continueCourse.category || '课程'}</span>
                        <span className="edu-chip-slate">{levelLabel(continueCourse.level)}</span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-ink leading-snug">{continueCourse.title}</h3>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-ink-muted">
                        <span>进度</span><span>{continueCourse.progress ?? 0}%</span>
                      </div>
                      <div className="edu-progress"><span style={{ width: `${continueCourse.progress ?? 0}%` }} /></div>
                    </div>
                    <button
                      onClick={() => navigate(`/courses/${continueCourse.id}/learn/${continueLessonId}`)}
                      className="edu-btn-primary w-fit"
                    >
                      进入课程 <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="edu-empty">暂无课程</div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="edu-card p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="edu-section-title">我的课程</h2>
                  <Button onClick={() => navigate('/courses')} variant="ghost" className="rounded-full h-8 text-xs">更多</Button>
                </div>
                <div className="space-y-1.5">
                  {courseList.map((course) => (
                    <button key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className="edu-row w-full text-left">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">{course.title}</p>
                        <p className="text-[11px] text-ink-muted mt-0.5">{levelLabel(course.level)} · {course.progress ?? 0}%</p>
                      </div>
                      <div className="w-16 shrink-0">
                        <div className="edu-progress"><span style={{ width: `${course.progress ?? 0}%` }} /></div>
                      </div>
                    </button>
                  ))}
                  {!courseList.length && <div className="edu-empty">暂无课程</div>}
                </div>
              </section>

              <section className="edu-card p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="edu-section-title">最近作业</h2>
                  <Button onClick={() => navigate('/assignments')} variant="ghost" className="rounded-full h-8 text-xs">更多</Button>
                </div>
                <div className="space-y-1.5">
                  {assignments.slice(0, 6).map((assignment) => (
                    <button key={assignment.id} onClick={() => navigate('/assignments')} className="edu-row w-full text-left">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">{assignment.title}</p>
                        <p className="text-[11px] text-ink-muted mt-0.5">{assignment.course || '课程'} · {assignment.dueDate || '待定'}</p>
                      </div>
                      <span className={
                        assignment.status === 'graded' ? 'edu-chip-green' :
                        assignment.status === 'pending' ? 'edu-chip-amber' : 'edu-chip-slate'
                      }>
                        {statusLabel(assignment.status)}
                      </span>
                    </button>
                  ))}
                  {!assignments.length && <div className="edu-empty">暂无作业</div>}
                </div>
              </section>
            </div>
          </div>

          {/* Right rail — dense, like reference side panels */}
          <aside className="lg:col-span-4 space-y-4">
            <section className="edu-side-panel">
              <h2 className="edu-section-title">待办作业</h2>
              <div className="space-y-1.5">
                {todoAssignments.length ? todoAssignments.map((item) => (
                  <button key={item.id} onClick={() => navigate('/assignments')} className="edu-row w-full text-left">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">{item.title}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />{item.dueDate || '待定'}
                      </p>
                    </div>
                    <FileText className="w-4 h-4 text-ink-muted shrink-0" />
                  </button>
                )) : <div className="edu-empty">暂无待办</div>}
              </div>
            </section>

            <section className="edu-side-panel">
              <h2 className="edu-section-title">下次直播</h2>
              {upcomingLive ? (
                <div className="edu-card-soft p-3.5 space-y-2.5">
                  <span className="edu-chip-blue"><Video className="w-3 h-3" />直播</span>
                  <p className="text-[14px] font-semibold text-ink leading-snug">{upcomingLive.title}</p>
                  <div className="space-y-1 text-[12px] text-ink-muted">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{upcomingLive.date || '待定'}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{upcomingLive.time || '待定'}</div>
                  </div>
                  <button onClick={() => navigate('/live')} className="edu-btn-secondary w-full">查看安排</button>
                </div>
              ) : (
                <div className="edu-empty">暂无直播</div>
              )}
            </section>

            <section className="edu-side-panel">
              <h2 className="edu-section-title">快捷入口</h2>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => navigate('/courses')} className="edu-card-soft p-3 text-left hover:border-primary/20">
                  <BookOpen className="w-4 h-4 text-primary mb-1.5" />
                  <p className="text-[12px] font-semibold text-ink">课程</p>
                </button>
                <button onClick={() => navigate('/resources')} className="edu-card-soft p-3 text-left hover:border-primary/20">
                  <FileText className="w-4 h-4 text-primary mb-1.5" />
                  <p className="text-[12px] font-semibold text-ink">资料</p>
                </button>
                <button onClick={() => navigate('/assignments')} className="edu-card-soft p-3 text-left hover:border-primary/20">
                  <Clock className="w-4 h-4 text-primary mb-1.5" />
                  <p className="text-[12px] font-semibold text-ink">作业</p>
                </button>
                <button onClick={() => navigate('/live')} className="edu-card-soft p-3 text-left hover:border-primary/20">
                  <Video className="w-4 h-4 text-primary mb-1.5" />
                  <p className="text-[12px] font-semibold text-ink">直播</p>
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
