import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Shield, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { apiService } from '../../services/apiService';
import { User, MembershipLevel } from '../../types';
import { AdminLoadingCard, EmptyState, AdminPageHero } from './shared';
import { levelLabel } from '../../lib/utils';

const LEVELS = ['Core', 'Advanced', 'Mastery', 'Elite'] as const;

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await apiService.getUsers();
        const users = Array.isArray(response.data) ? response.data : [];
        setStudents(
          users
            .filter((user) => user.role === 'student')
            .map((user) => ({
              ...user,
              membershipLevel: user.membershipLevel || 'Core',
            }))
        );
      } catch (error) {
        toast.error('获取学生列表失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    );
  });

  const handleLevelChange = async (student: User, newLevel: string) => {
    try {
      await apiService.updateUser(student.id, { membershipLevel: newLevel as MembershipLevel });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, membershipLevel: newLevel as MembershipLevel } : s))
      );
      toast.success(`已将 ${student.name} 的会员等级更新为「${levelLabel(newLevel)}」`);
    } catch {
      toast.error('更新会员等级失败');
    }
  };

  const handleVerify = async (student: User) => {
    try {
      await apiService.updateUser(student.id, { isVerified: true });
      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, isVerified: true } : s)));
      toast.success(`已认证学生「${student.name}」`);
    } catch {
      toast.error('认证失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiService.deleteUser(deleteTarget.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success(`已删除学生「${deleteTarget.name}」`);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || '删除学生失败');
    }
  };

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 md:px-10 py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <AdminPageHero
          eyebrow="学生管理"
          title="学生账号与权限"
          primary={{ label: '查看课程', action: () => navigate('/admin/courses') }}
          secondary={{ label: '查看作业', action: () => navigate('/admin/assignments') }}
        />

        {/* 搜索框 */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索学生姓名或邮箱..."
            className="w-full pl-11 pr-4 py-3 rounded-full border border-outline bg-surface text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>

        {isLoading ? (
          <AdminLoadingCard label="正在加载学生列表..." />
        ) : (
          <>
            {/* ── 桌面端表格 ── */}
            <div className="hidden lg:block bg-surface border border-outline rounded-[18px] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-outline bg-surface-alt text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                <div className="col-span-3">学生</div>
                <div className="col-span-3">邮箱</div>
                <div className="col-span-2">会员等级</div>
                <div className="col-span-1">状态</div>
                <div className="col-span-2">加入时间</div>
                <div className="col-span-1 text-right">操作</div>
              </div>
              <div className="divide-y divide-outline">
                {filtered.map((student) => {
                  const memberSince = student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString('zh-CN')
                    : '未记录';
                  const verified = !!student.isVerified;

                  return (
                    <div key={student.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center">
                      <div className="col-span-3">
                        <p className="text-base font-bold tracking-tight font-display text-ink">{student.name}</p>
                        <p className="text-xs text-ink-muted font-medium truncate">ID: {student.id}</p>
                      </div>
                      <div className="col-span-3 text-sm font-medium text-ink-muted break-all">{student.email}</div>
                      <div className="col-span-2">
                        <select
                          value={student.membershipLevel || 'Core'}
                          onChange={(e) => handleLevelChange(student, e.target.value)}
                          className="rounded-full bg-surface-alt border border-outline px-3 py-1.5 text-xs font-bold text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>{levelLabel(lvl)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => !verified && handleVerify(student)}
                          className={verified
                            ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                            : 'inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 hover:bg-amber-100'}
                          title={verified ? '已认证' : '点击认证该学生'}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {verified ? '已验证' : '待验证'}
                        </button>
                      </div>
                      <div className="col-span-2 text-sm font-medium text-ink-muted">{memberSince}</div>
                      <div className="col-span-1 flex justify-end">
                        <Button onClick={() => setDeleteTarget(student)} variant="ghost" className="rounded-full px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {!filtered.length && (
                  <div className="px-8 py-16">
                    <EmptyState text="暂无学生" />
                  </div>
                )}
              </div>
            </div>

            {/* ── 移动端卡片 ── */}
            <div className="lg:hidden space-y-3">
              {filtered.map((student) => {
                const memberSince = student.createdAt
                  ? new Date(student.createdAt).toLocaleDateString('zh-CN')
                  : '未记录';
                const verified = !!student.isVerified;

                return (
                  <div key={student.id} className="bg-surface border border-outline rounded-[18px] p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold tracking-tight font-display text-ink truncate">{student.name}</p>
                        <p className="text-sm text-ink-muted font-medium truncate">{student.email}</p>
                      </div>
                      <Button onClick={() => setDeleteTarget(student)} variant="ghost" className="rounded-full px-2 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={student.membershipLevel || 'Core'}
                        onChange={(e) => handleLevelChange(student, e.target.value)}
                        className="rounded-full bg-surface-alt border border-outline px-3 py-1.5 text-xs font-bold text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{levelLabel(lvl)}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => !verified && handleVerify(student)}
                        className={verified
                          ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                          : 'inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20'}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {verified ? '已验证' : '点击认证'}
                      </button>
                      <span className="text-xs text-ink-muted">加入于 {memberSince}</span>
                    </div>
                  </div>
                );
              })}
              {!filtered.length && (
                <div className="py-16">
                  <EmptyState text="暂无学生" />
                </div>
              )}
            </div>

            {/* ── 删除确认弹窗 ── */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="删除学生">
              {deleteTarget && (
                <div className="space-y-6 p-2">
                  <p className="text-sm text-ink-muted leading-relaxed font-medium">
                    你将删除学生 <span className="font-bold text-ink">{deleteTarget.name}</span>（{deleteTarget.email}），此操作不可撤销。
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
