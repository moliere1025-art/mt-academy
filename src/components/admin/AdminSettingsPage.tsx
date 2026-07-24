import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, FileText, Video, Shield, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/apiService';
import { AdminPageHero } from './shared';

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, courses: 0, assignments: 0, liveSessions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, coursesRes, assignRes, liveRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getCourses(),
          apiService.getAssignments(),
          apiService.getLiveSessions(),
        ]);
        setStats({
          users: Array.isArray(usersRes.data) ? usersRes.data.filter((u: any) => u.role === 'student').length : 0,
          courses: Array.isArray(coursesRes.data) ? coursesRes.data.length : 0,
          assignments: Array.isArray(assignRes.data) ? assignRes.data.length : 0,
          liveSessions: Array.isArray(liveRes.data) ? liveRes.data.length : 0,
        });
      } catch {
        toast.error('获取统计数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: '注册学生', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '课程总数', value: stats.courses, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
    { label: '作业总数', value: stats.assignments, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: '直播安排', value: stats.liveSessions, icon: Video, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const quickActions = [
    { label: '学生', action: () => navigate('/admin/students'), icon: Users },
    { label: '课程', action: () => navigate('/admin/courses'), icon: BookOpen },
    { label: '作业', action: () => navigate('/admin/assignments'), icon: FileText },
    { label: '直播', action: () => navigate('/admin/live'), icon: Video },
  ];

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 md:px-10 py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <AdminPageHero
          eyebrow="系统设置"
          title="平台概览与配置"
          primary={{ label: '返回后台首页', action: () => navigate('/admin') }}
          secondary={{ label: '查看课程', action: () => navigate('/admin/courses') }}
        />

        {/* 平台信息 */}
        <div className="bg-surface border border-outline rounded-[18px] p-5 sm:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight font-display text-ink">MT Academy</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-outline bg-surface-alt p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1">{card.label}</p>
                {isLoading ? (
                  <div className="h-8 w-12 rounded bg-surface-alt animate-pulse" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{card.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-surface border border-outline rounded-[18px] p-5 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-ink-muted" />
            <h2 className="text-lg font-bold tracking-tight font-display text-ink">快速操作</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {quickActions.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="text-left rounded-[18px] border border-outline bg-surface-alt p-5 hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-ink">{item.label}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
