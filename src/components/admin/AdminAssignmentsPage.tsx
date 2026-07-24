import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { apiService, SubmissionRecord as ApiSubmissionRecord } from '../../services/apiService';
import { Course } from '../../types';
import { AdminLoadingCard, AdminPageHero, FormField, EmptyState } from './shared';

interface AssignmentItem {
  id: string;
  title: string;
  courseId?: string;
  course?: string;
  dueDate?: string;
  status?: string;
}

export default function AdminAssignmentsPage() {
  const [tab, setTab] = useState<'assignments' | 'submissions'>('assignments');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<ApiSubmissionRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterGradeStatus, setFilterGradeStatus] = useState<'all' | 'ungraded' | 'graded'>('all');

  // 作业表单
  const [isAssignModal, setIsAssignModal] = useState(false);
  const [editAssign, setEditAssign] = useState<AssignmentItem | null>(null);
  const [assignForm, setAssignForm] = useState({ title: '', courseId: '', description: '', dueDate: '' });
  const [deleteAssign, setDeleteAssign] = useState<AssignmentItem | null>(null);

  // 批改表单
  const [selectedSubmission, setSelectedSubmission] = useState<ApiSubmissionRecord | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, subRes, courseRes] = await Promise.all([
          apiService.getAssignments(),
          apiService.getSubmissions(),
          apiService.getCourses(),
        ]);
        setAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
        setSubmissions(Array.isArray(subRes.data) ? subRes.data : []);
        setCourses(Array.isArray(courseRes.data) ? courseRes.data : []);
      } catch {
        toast.error('获取数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── 作业 CRUD ──
  const openCreateAssign = () => {
    setEditAssign(null);
    setAssignForm({ title: '', courseId: courses[0]?.id || '', description: '', dueDate: '' });
    setIsAssignModal(true);
  };

  const openEditAssign = (a: AssignmentItem) => {
    setEditAssign(a);
    setAssignForm({
      title: a.title,
      courseId: a.courseId || '',
      description: (a as any).description || '',
      dueDate: a.dueDate || '',
    });
    setIsAssignModal(true);
  };

  const courseName = (courseId?: string) =>
    courses.find((c) => c.id === courseId)?.title || courseId || '';

  const handleSaveAssign = async () => {
    if (!assignForm.title.trim()) { toast.error('请输入作业标题'); return; }
    if (!assignForm.courseId) { toast.error('请选择关联课程'); return; }

    try {
      if (editAssign) {
        const res = await apiService.updateAssignment(editAssign.id, {
          title: assignForm.title.trim(),
          courseId: assignForm.courseId,
          description: assignForm.description || undefined,
          dueDate: assignForm.dueDate || undefined,
        } as any);
        const updated = (res.data as any)?.data || res.data;
        setAssignments((prev) => prev.map((a) => (a.id === editAssign.id ? { ...a, ...updated } : a)));
        toast.success('作业已更新');
      } else {
        const res = await apiService.createAssignment({
          title: assignForm.title.trim(),
          courseId: assignForm.courseId,
          description: assignForm.description || undefined,
          dueDate: assignForm.dueDate || undefined,
        });
        const created = (res.data as any)?.data || res.data;
        setAssignments((prev) => [...prev, created]);
        toast.success('作业已创建');
      }
      setIsAssignModal(false);
      setEditAssign(null);
    } catch {
      toast.error(editAssign ? '更新作业失败' : '创建作业失败');
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filterCourseId) {
      const assignment = assignments.find((item) => item.id === sub.assignmentId);
      if (assignment) {
        if (assignment.courseId !== filterCourseId) return false;
      } else if (sub.courseTitle && sub.courseTitle !== courseName(filterCourseId)) {
        return false;
      }
    }
    if (filterGradeStatus === 'ungraded' && sub.grade) return false;
    if (filterGradeStatus === 'graded' && !sub.grade) return false;
    return true;
  });

  const handleDeleteAssign = async () => {
    if (!deleteAssign) return;
    try {
      await apiService.deleteAssignment(deleteAssign.id);
      setAssignments((prev) => prev.filter((a) => a.id !== deleteAssign.id));
      toast.success('作业已删除');
      setDeleteAssign(null);
    } catch {
      toast.error('删除作业失败');
    }
  };

  // ── 批改 ──
  const openGradeModal = (sub: ApiSubmissionRecord) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade || '');
    setFeedback(sub.feedback || '');
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;
    try {
      await apiService.gradeSubmission(selectedSubmission.id, { grade, feedback });
      setSubmissions((prev) => prev.map((s) => (s.id === selectedSubmission.id ? { ...s, grade, feedback } : s)));
      toast.success('批改结果已提交');
      setSelectedSubmission(null);
    } catch {
      toast.error('提交批改结果失败');
    }
  };

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 md:px-10 py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <AdminPageHero
          eyebrow="作业管理"
          title="作业发布与批改"
          primary={{ label: '新建作业', action: openCreateAssign }}
          secondary={{ label: '管理直播', action: () => navigate('/admin/live') }}
        />

        {/* Tab 切换 */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('assignments')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${tab === 'assignments' ? 'bg-primary text-white' : 'bg-surface-alt border border-outline text-ink-muted hover:text-ink'}`}
            >
              作业列表 ({assignments.length})
            </button>
            <button
              onClick={() => setTab('submissions')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${tab === 'submissions' ? 'bg-primary text-white' : 'bg-surface-alt border border-outline text-ink-muted hover:text-ink'}`}
            >
              学生提交 ({filteredSubmissions.length}/{submissions.length})
            </button>
          </div>
          {tab === 'submissions' && (
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCourseId}
                onChange={(e) => setFilterCourseId(e.target.value)}
                className="rounded-full border border-outline bg-surface px-4 py-2 text-sm text-ink"
              >
                <option value="">全部课程</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <select
                value={filterGradeStatus}
                onChange={(e) => setFilterGradeStatus(e.target.value as 'all' | 'ungraded' | 'graded')}
                className="rounded-full border border-outline bg-surface px-4 py-2 text-sm text-ink"
              >
                <option value="all">全部状态</option>
                <option value="ungraded">仅未批改</option>
                <option value="graded">仅已批改</option>
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <AdminLoadingCard label="正在加载数据..." />
        ) : tab === 'assignments' ? (
          <>
            {/* ── 作业列表 — 桌面端 ── */}
            <div className="hidden lg:block bg-surface border border-outline rounded-[18px] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-outline bg-surface-alt text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                <div className="col-span-4">作业标题</div>
                <div className="col-span-3">关联课程</div>
                <div className="col-span-2">截止日期</div>
                <div className="col-span-3 text-right">操作</div>
              </div>
              <div className="divide-y divide-outline">
                {assignments.map((a) => (
                  <div key={a.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center">
                    <div className="col-span-4">
                      <p className="text-base font-bold tracking-tight font-display text-ink">{a.title}</p>
                    </div>
                    <div className="col-span-3 text-sm font-medium text-ink-muted truncate">{a.course || courseName(a.courseId)}</div>
                    <div className="col-span-2 text-sm font-medium text-ink-muted">{a.dueDate || '无截止日期'}</div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <Button onClick={() => openEditAssign(a)} variant="secondary" className="rounded-full px-5">编辑</Button>
                      <Button onClick={() => setDeleteAssign(a)} variant="ghost" className="rounded-full px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!assignments.length && <div className="px-8 py-16"><EmptyState text="暂无作业" /></div>}
              </div>
            </div>

            {/* ── 作业列表 — 移动端 ── */}
            <div className="lg:hidden space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="bg-surface border border-outline rounded-[18px] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold tracking-tight font-display text-ink truncate">{a.title}</p>
                      <p className="text-sm text-ink-muted">{a.course || courseName(a.courseId)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button onClick={() => openEditAssign(a)} variant="secondary" className="rounded-full px-3 py-2">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => setDeleteAssign(a)} variant="ghost" className="rounded-full px-2 py-2 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-ink-muted">截止: {a.dueDate || '无截止日期'}</p>
                </div>
              ))}
              {!assignments.length && <div className="py-16"><EmptyState text="暂无作业" /></div>}
            </div>
          </>
        ) : (
          <>
            {/* ── 学生提交 — 桌面端 ── */}
            <div className="hidden lg:block bg-surface border border-outline rounded-[18px] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-outline bg-surface-alt text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                <div className="col-span-3">学生</div>
                <div className="col-span-3">作业</div>
                <div className="col-span-2">提交时间</div>
                <div className="col-span-2">评分</div>
                <div className="col-span-2 text-right">操作</div>
              </div>
              <div className="divide-y divide-outline">
                {filteredSubmissions.map((sub) => (
                  <div key={sub.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center">
                    <div className="col-span-3">
                      <p className="text-base font-bold tracking-tight font-display text-ink">{sub.studentName}</p>
                      <p className="text-sm text-ink-muted font-medium">{sub.courseTitle || '课程'}</p>
                    </div>
                    <div className="col-span-3 text-sm font-bold text-ink-muted">{sub.assignmentTitle}</div>
                    <div className="col-span-2 text-sm font-medium text-ink-muted">{sub.submittedAt}</div>
                    <div className="col-span-2">
                      <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border bg-primary/5 text-primary border-primary/10">
                        {sub.grade ? `${sub.grade} 分` : '待批改'}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button onClick={() => openGradeModal(sub)} variant="secondary" className="rounded-full px-5">
                        {sub.grade ? '重新批改' : '立即批改'}
                      </Button>
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-outline bg-surface-alt text-ink-muted hover:text-ink hover:bg-surface transition-colors flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {!filteredSubmissions.length && <div className="px-8 py-16"><EmptyState text="暂无提交" /></div>}
              </div>
            </div>

            {/* ── 学生提交 — 移动端 ── */}
            <div className="lg:hidden space-y-3">
              {filteredSubmissions.map((sub) => (
                <div key={sub.id} className="bg-surface border border-outline rounded-[18px] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold tracking-tight font-display text-ink truncate">{sub.studentName}</p>
                      <p className="text-sm text-ink-muted">{sub.assignmentTitle}</p>
                    </div>
                    <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border bg-primary/5 text-primary border-primary/10 shrink-0">
                      {sub.grade ? `${sub.grade} 分` : '待批改'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-muted">{sub.submittedAt}</span>
                    <div className="flex-1" />
                    <Button onClick={() => openGradeModal(sub)} variant="secondary" className="rounded-full px-4 text-sm">
                      {sub.grade ? '重新批改' : '批改'}
                    </Button>
                    {sub.fileUrl && (
                      <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-outline bg-surface-alt text-ink-muted hover:text-ink flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {!filteredSubmissions.length && <div className="py-16"><EmptyState text="暂无提交" /></div>}
            </div>
          </>
        )}

        {/* ── 创建/编辑作业弹窗 ── */}
        <Modal isOpen={isAssignModal} onClose={() => { setIsAssignModal(false); setEditAssign(null); }} title={editAssign ? '编辑作业' : '新建作业'}>
          <div className="space-y-5 p-2">
            <FormField label="作业标题">
              <input value={assignForm.title} onChange={(e) => setAssignForm((f) => ({ ...f, title: e.target.value }))} className="admin-input" placeholder="输入作业标题" />
            </FormField>
            <FormField label="关联课程">
              <select value={assignForm.courseId} onChange={(e) => setAssignForm((f) => ({ ...f, courseId: e.target.value }))} className="admin-input">
                <option value="">选择课程</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </FormField>
            <FormField label="作业说明（可选）">
              <textarea
                value={assignForm.description}
                onChange={(e) => setAssignForm((f) => ({ ...f, description: e.target.value }))}
                className="admin-input min-h-[100px] resize-none"
                placeholder="补充作业要求"
              />
            </FormField>
            <FormField label="截止日期（可选）">
              <input value={assignForm.dueDate} onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))} type="date" className="admin-input" />
            </FormField>
            <Button onClick={handleSaveAssign} variant="primary" className="w-full rounded-full">
              {editAssign ? '保存修改' : '创建作业'}
            </Button>
          </div>
        </Modal>

        {/* ── 删除作业弹窗 ── */}
        <Modal isOpen={!!deleteAssign} onClose={() => setDeleteAssign(null)} title="删除作业">
          {deleteAssign && (
            <div className="space-y-6 p-2">
              <p className="text-sm text-ink-muted leading-relaxed font-medium">
                你将删除作业 <span className="font-bold text-ink">{deleteAssign.title}</span>，关联的学生提交也会被删除，此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setDeleteAssign(null)} variant="secondary" className="flex-1 rounded-full">取消</Button>
                <Button onClick={handleDeleteAssign} variant="primary" className="flex-1 rounded-full bg-red-600 hover:bg-red-500 border-red-600">确认删除</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── 批改弹窗 ── */}
        <Modal isOpen={!!selectedSubmission} onClose={() => setSelectedSubmission(null)} title="作业批改">
          {selectedSubmission && (
            <div className="space-y-6 p-2">
              <div className="rounded-[18px] border border-outline bg-surface-alt p-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">提交信息</p>
                <p className="text-lg font-bold uppercase font-display text-ink">{selectedSubmission.assignmentTitle}</p>
                <p className="text-sm text-ink-muted font-medium">{selectedSubmission.studentName} · {selectedSubmission.submittedAt}</p>
                {selectedSubmission.remark && (
                  <div className="pt-3 border-t border-outline space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">学生备注</p>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{selectedSubmission.remark}</p>
                  </div>
                )}
              </div>
              <FormField label="评分">
                <input value={grade} onChange={(e) => setGrade(e.target.value)} type="number" className="admin-input" placeholder="输入分数" />
              </FormField>
              <FormField label="反馈">
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="admin-input min-h-[140px] resize-none" placeholder="输入教师反馈" />
              </FormField>
              <Button onClick={handleSubmitGrade} variant="primary" className="w-full rounded-full">
                提交批改结果
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
