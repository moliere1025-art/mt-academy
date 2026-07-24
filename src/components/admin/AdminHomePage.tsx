import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText, Users, Video } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import { apiService, SubmissionRecord } from '../../services/apiService';
import { Course, LiveSession, User } from '../../types';
import { AdminLoadingCard, EmptyState, AdminPageHero } from './shared';

export default function AdminHomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, usersRes, submissionsRes, liveRes] = await Promise.all([
          apiService.getCourses(),
          apiService.getUsers(),
          apiService.getSubmissions(),
          apiService.getLiveSessions(),
        ]);

        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setStudents(Array.isArray(usersRes.data) ? usersRes.data.filter((user) => user.role === 'student') : []);
        setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
        setLiveSessions(Array.isArray(liveRes.data) ? liveRes.data : []);
      } catch (error) {
        toast.error('获取后台概览数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const pendingAssignments = submissions.filter((submission) => !submission.grade).length;
    return [
      { label: '课程总数', value: courses.length, icon: BookOpen },
      { label: '学生人数', value: students.length, icon: Users },
      { label: '待处理作业', value: pendingAssignments, icon: FileText },
      { label: '直播安排', value: liveSessions.length, icon: Video },
    ];
  }, [courses.length, liveSessions.length, students.length, submissions]);

  if (isLoading) {
    return <AdminLoadingCard label="正在加载后台概览..." />;
  }

  return (
    <div className="min-h-screen bg-app px-6 md:px-10 py-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <AdminPageHero
          eyebrow="后台首页"
          title="教学管理总览"
          primary={{ label: '新建课程', action: () => navigate('/admin/courses/new') }}
          secondary={{ label: '管理直播', action: () => navigate('/admin/live') }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((item) => (
            <div key={item.label} className="bg-surface border border-outline rounded-[18px] p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2">{item.label}</p>
                <p className="text-3xl font-bold tracking-tight text-ink">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-surface border border-outline rounded-[18px] p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight font-display text-ink">最近课程</h2>
              <Button onClick={() => navigate('/admin/courses')} variant="ghost" className="rounded-full">
                全部课程
              </Button>
            </div>
            <div className="space-y-4">
              {courses.slice(0, 4).map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                  className="w-full text-left rounded-[18px] border border-outline bg-surface-alt p-5 hover:bg-primary/5 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{course.category || '课程'}</p>
                      <h3 className="text-lg font-bold tracking-tight font-display text-ink">{course.title}</h3>
                      <p className="text-sm text-ink-muted font-medium">{course.instructor} · {course.level || '等级'} · {course.duration || '--'}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-ink-muted" />
                  </div>
                </button>
              ))}
              {!courses.length && <EmptyState text="暂无课程" />}
            </div>
          </div>

          <div className="bg-surface border border-outline rounded-[18px] p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight font-display text-ink">近期直播</h2>
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-4">
              <div className="rounded-[18px] border border-outline p-5 space-y-3 bg-surface-alt">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">近期直播</p>
                {liveSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="space-y-1">
                    <p className="text-sm font-bold uppercase text-ink">{session.title}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{session.date || '待定'} · {session.time || '待定时间'}</p>
                  </div>
                ))}
                {!liveSessions.length && <p className="text-sm text-ink-muted font-medium">暂无直播</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
