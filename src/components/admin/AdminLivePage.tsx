import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { apiService } from '../../services/apiService';
import { LiveSession } from '../../types';
import { AdminLoadingCard, AdminPageHero, EmptyState, FormField } from './shared';

const emptyForm: LiveSession = {
  id: '', title: '', date: '', time: '', instructor: '课程导师',
  status: 'upcoming', type: '直播', replayUrl: '',
};

export default function AdminLivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LiveSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LiveSession | null>(null);
  const [form, setForm] = useState<LiveSession>({ ...emptyForm });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await apiService.getLiveSessions();
        setSessions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error('获取直播安排失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (session: LiveSession) => {
    setEditTarget(session);
    setForm({ ...session });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) { toast.error('请先填写直播标题'); return; }

    try {
      const payload: LiveSession = {
        ...form,
        id: form.id || `live-${Date.now()}`,
        title: trimmedTitle,
        date: form.date?.trim() || '',
        time: form.time?.trim() || '',
        instructor: form.instructor?.trim() || '课程导师',
        status: form.status?.trim() || 'upcoming',
        type: form.type?.trim() || '直播',
        replayUrl: form.replayUrl?.trim() || '',
      };

      if (editTarget) {
        const response = await apiService.updateLiveSession(editTarget.id, payload);
        const updated = (response.data as any)?.data || response.data;
        setSessions((prev) => prev.map((s) => (s.id === editTarget.id ? { ...s, ...updated } : s)));
        toast.success('直播安排已更新');
      } else {
        const response = await apiService.createLiveSession(payload);
        setSessions((prev) => [...prev, response.data].sort((a, b) =>
          `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`)
        ));
        toast.success('直播安排已创建');
      }

      setIsModalOpen(false);
      setForm({ ...emptyForm });
      setEditTarget(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || (editTarget ? '更新直播安排失败' : '创建直播安排失败'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiService.deleteLiveSession(deleteTarget.id);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success('直播安排已删除');
      setDeleteTarget(null);
    } catch {
      toast.error('删除直播安排失败');
    }
  };

  const statusLabel = (s?: string) => {
    if (s === 'completed' || s === 'ended') return '已结束';
    if (s === 'replay') return '可回放';
    if (s === 'live') return '直播中';
    return '即将开始';
  };

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 md:px-10 py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <AdminPageHero
          eyebrow="直播管理"
          title="直播排期与回放"
          primary={{ label: '新建直播', action: openCreate }}
          secondary={{ label: '查看课程', action: () => navigate('/admin/courses') }}
        />

        {isLoading ? (
          <AdminLoadingCard label="正在加载直播安排..." />
        ) : (
          <>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="bg-surface border border-outline rounded-[18px] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{session.type || '直播'}</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">· {statusLabel(session.status)}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight font-display text-ink truncate">{session.title}</h3>
                    <div className="flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                      {session.date && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {session.date}
                        </span>
                      )}
                      {session.time && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {session.time}
                        </span>
                      )}
                      {session.instructor && <span>讲师: {session.instructor}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button onClick={() => openEdit(session)} variant="secondary" className="rounded-full px-4 sm:px-5">
                      <Edit3 className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">编辑</span>
                    </Button>
                    <Button onClick={() => setDeleteTarget(session)} variant="ghost" className="rounded-full px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!sessions.length && (
                <div className="py-16">
                  <EmptyState text="暂无直播" />
                </div>
              )}
            </div>

            {/* ── 创建/编辑弹窗 ── */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditTarget(null); }} title={editTarget ? '编辑直播安排' : '新建直播安排'}>
              <div className="space-y-5 p-2">
                <FormField label="直播标题">
                  <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="admin-input" placeholder="输入直播标题" />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="日期">
                    <input value={form.date || ''} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} type="date" className="admin-input" />
                  </FormField>
                  <FormField label="时间">
                    <input value={form.time || ''} onChange={(e) => setForm((c) => ({ ...c, time: e.target.value }))} type="time" className="admin-input" />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="讲师">
                    <input value={form.instructor || ''} onChange={(e) => setForm((c) => ({ ...c, instructor: e.target.value }))} className="admin-input" placeholder="讲师名称" />
                  </FormField>
                  <FormField label="状态">
                    <select value={form.status || 'upcoming'} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} className="admin-input">
                      <option value="upcoming">即将开始</option>
                      <option value="live">直播中</option>
                      <option value="completed">已结束</option>
                      <option value="replay">可回放</option>
                    </select>
                  </FormField>
                  <FormField label="类型">
                    <input value={form.type || ''} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))} className="admin-input" placeholder="如：直播 / 答疑" />
                  </FormField>
                </div>
                <FormField label="回放链接（可选）">
                  <input value={form.replayUrl || ''} onChange={(e) => setForm((c) => ({ ...c, replayUrl: e.target.value }))} className="admin-input" placeholder="输入回放链接" />
                </FormField>
                <Button onClick={handleSave} variant="primary" className="w-full rounded-full">
                  {editTarget ? '保存修改' : '创建直播安排'}
                </Button>
              </div>
            </Modal>

            {/* ── 删除确认弹窗 ── */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="删除直播">
              {deleteTarget && (
                <div className="space-y-6 p-2">
                  <p className="text-sm text-ink-muted leading-relaxed font-medium">
                    你将删除直播 <span className="font-bold text-ink">{deleteTarget.title}</span>，此操作不可撤销。
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setDeleteTarget(null)} variant="secondary" className="flex-1 rounded-full">取消</Button>
                    <Button onClick={handleDelete} variant="primary" className="flex-1 rounded-full bg-red-600 hover:bg-red-500 border-red-600">确认删除</Button>
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
