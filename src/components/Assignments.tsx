import React, { useEffect, useMemo, useState } from 'react';
import {
  FileEdit,
  Clock,
  ChevronRight,
  MessageSquare,
  ArrowUpRight,
  Download,
  Upload,
  Trophy,
  History,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import Modal from './ui/Modal';
import FileUpload from './ui/FileUpload';
import { toast } from 'sonner';
import { apiService, SubmissionRecord } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Assignment } from '../types';

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionMap, setSubmissionMap] = useState<Record<string, SubmissionRecord>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const [assignmentsResponse, submissionsResponse] = await Promise.all([
          apiService.getAssignments(),
          apiService.getSubmissions(),
        ]);

        const assignmentList = Array.isArray(assignmentsResponse.data) ? assignmentsResponse.data : [];
        const submissions = Array.isArray(submissionsResponse.data) ? submissionsResponse.data : [];

        const submissionMap = new Map(
          submissions.map((submission) => [submission.assignmentId, submission])
        );

        setSubmissionMap(Object.fromEntries(submissions.map((submission) => [submission.assignmentId, submission])));

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
        console.error('Failed to fetch assignments:', error);
        toast.error('获取作业列表失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const summary = useMemo(() => ({
    pending: assignments.filter((a) => a.status === 'pending').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    unsubmitted: assignments.filter((a) => a.status === 'not_submitted' || !a.status).length,
  }), [assignments]);

  const handleOpenSubmit = (assignment?: Assignment) => {
    setActiveAssignmentId(assignment?.id || null);
    setUploadedFileUrl(null);
    setRemark('');
    setIsSubmitModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    if (!activeAssignmentId) {
      toast.error('请先选择要提交的作业');
      return;
    }

    if (!uploadedFileUrl) {
      toast.error('请先上传作业文件');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', activeAssignmentId);
      formData.append('fileUrl', uploadedFileUrl);
      if (remark.trim()) {
        formData.append('remark', remark.trim());
      }

      const response = await apiService.submitHomework(formData);
      const persistedSubmission = response.data as SubmissionRecord;

      const assignmentTitle = assignments.find((item) => item.id === activeAssignmentId)?.title || '';
      const assignmentCourse = assignments.find((item) => item.id === activeAssignmentId)?.course;
      const submittedAt = persistedSubmission?.submittedAt || new Date().toISOString().slice(0, 10);
      const nextSubmission: SubmissionRecord = {
        id: persistedSubmission?.id || `local-${Date.now()}`,
        studentId: persistedSubmission?.studentId || user?.id || 'current-user',
        assignmentId: activeAssignmentId,
        assignmentTitle: persistedSubmission?.assignmentTitle || assignmentTitle,
        courseTitle: persistedSubmission?.courseTitle || assignmentCourse,
        studentName: persistedSubmission?.studentName || user?.name || 'current-user',
        fileUrl: persistedSubmission?.fileUrl || uploadedFileUrl,
        remark: persistedSubmission?.remark || remark.trim() || undefined,
        submittedAt,
        grade: persistedSubmission?.grade,
        feedback: persistedSubmission?.feedback,
      };

      setSubmissionMap((current) => ({
        ...current,
        [activeAssignmentId]: nextSubmission,
      }));

      setAssignments((current) => current.map((assignment) => (
        assignment.id === activeAssignmentId
          ? {
              ...assignment,
              status: 'pending',
              submittedAt,
            }
          : assignment
      )));

      setSelectedAssignment((current) => (
        current?.id === activeAssignmentId
          ? {
              ...current,
              status: 'pending',
              submittedAt,
            }
          : current
      ));

      toast.success('作业已提交');
      setIsSubmitModalOpen(false);
      setUploadedFileUrl(null);
      setActiveAssignmentId(null);
      setRemark('');
    } catch (error) {
      console.error('Failed to submit homework:', error);
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div><h1 className="edu-title">我的作业</h1></div>

          <div className="grid grid-cols-3 gap-2 w-full xl:w-auto">
            <div className="edu-stat flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="edu-stat-label">待批改</p>
                <p className="text-[20px] font-semibold tracking-tight text-ink">{summary.pending}</p>
              </div>
            </div>
            <div className="edu-stat flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="edu-stat-label">已评分</p>
                <p className="text-[20px] font-semibold tracking-tight text-ink">{summary.graded}</p>
              </div>
            </div>
            <div className="edu-stat flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="edu-stat-label">未提交</p>
                <p className="text-[20px] font-semibold tracking-tight text-ink">{summary.unsubmitted}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="edu-card p-3.5 transition-all hover:border-primary/15"
            >
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center border shrink-0',
                      assignment.status === 'graded' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      assignment.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-surface-alt text-ink-muted border-outline'
                    )}
                  >
                    <FileEdit className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="edu-chip-blue">
                        {assignment.course || '课程作业'}
                      </span>
                    </div>
                    <h3 className="text-[20px] font-semibold tracking-tight text-ink leading-tight font-display">
                      {assignment.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-[11px] font-medium text-ink-muted">
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{assignment.dueDate || '待定截止时间'}</span>
                      {assignment.submittedAt && (
                        <span className="flex items-center gap-2"><History className="w-4 h-4" />{assignment.submittedAt}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {assignment.status === 'graded' && (
                    <div className="text-center px-6 xl:border-r xl:border-outline">
                      <p className="edu-stat-label">评分</p>
                      <p className="text-3xl font-bold text-primary tracking-tight">{assignment.score}</p>
                    </div>
                  )}

                  <div className="flex flex-col items-end gap-2 min-w-[140px]">
                    <div
                      className={cn(
                        'rounded-full text-[12px] font-semibold flex items-center gap-2 border px-3 py-1',
                        assignment.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        assignment.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-surface-alt text-ink-muted border-outline'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          assignment.status === 'graded' ? 'bg-emerald-500' :
                          assignment.status === 'pending' ? 'bg-amber-500' : 'bg-ink-muted/40'
                        )}
                      />
                      {assignment.status === 'graded' ? '已批改' : assignment.status === 'pending' ? '待批改' : '未提交'}
                    </div>

                    {assignment.status === 'not_submitted' || !assignment.status ? (
                      <Button
                        onClick={() => handleOpenSubmit(assignment)}
                        variant="primary"
                        size="sm"
                        className="rounded-full px-6 py-2.5 w-full"
                      >
                        立即提交
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setSelectedAssignment(assignment)}
                        variant="secondary"
                        size="sm"
                        className="rounded-full px-6 py-2.5 w-full"
                      >
                        查看详情
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {assignment.feedback && (
                <div className="mt-3 p-3 bg-surface-alt rounded-[12px] border border-outline flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">教师反馈</p>
                    <p className="text-sm font-medium text-ink-muted leading-relaxed">
                      {assignment.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex">
          <Button
            onClick={() => handleOpenSubmit(assignments.find((item) => item.status === 'not_submitted' || !item.status))}
            variant="primary"
            className="rounded-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            上传作业
          </Button>
        </div>

        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => {
            setIsSubmitModalOpen(false);
            setUploadedFileUrl(null);
            setActiveAssignmentId(null);
            setRemark('');
          }}
          title="提交作业"
          className="max-w-2xl"
        >
          <div className="space-y-8 p-2">
            <div className="rounded-[18px] border border-outline bg-surface-alt p-5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">当前提交</p>
              <p className="text-lg font-bold uppercase font-display text-ink">
                {assignments.find((item) => item.id === activeAssignmentId)?.title || '请选择作业'}
              </p>
            </div>

            <FileUpload onUploadSuccess={(url) => setUploadedFileUrl(url)} label="上传作业文件" maxSize={20} className="mb-2" type="document" />

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest px-1">备注（可选）</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full admin-input min-h-[140px] resize-none"
                placeholder="备注（可选）"
              />
            </div>

            <Button
              onClick={handleFinalSubmit}
              variant="primary"
              size="lg"
              className="w-full rounded-full py-4"
              disabled={!uploadedFileUrl || !activeAssignmentId || isSubmitting}
            >
              {isSubmitting ? '提交中...' : '确认提交'}
            </Button>
          </div>
        </Modal>

        <Modal isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} title="作业详情" className="max-w-2xl">
          {selectedAssignment && (
            <div className="space-y-8 p-2">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold tracking-tight leading-tight font-display text-ink">{selectedAssignment.title}</h4>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedAssignment.course}</p>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">REF_ID: {selectedAssignment.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-surface-alt rounded-[18px] border border-outline">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">提交时间</p>
                  <p className="text-base font-bold text-ink">{selectedAssignment.submittedAt || '未提交'}</p>
                </div>
                <div className="p-5 bg-surface-alt rounded-[18px] border border-outline">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">当前状态</p>
                  <p
                    className={cn(
                      'text-base font-bold uppercase tracking-widest',
                      selectedAssignment.status === 'graded' ? 'text-emerald-600' :
                      selectedAssignment.status === 'pending' ? 'text-amber-600' : 'text-ink-muted'
                    )}
                  >
                    {selectedAssignment.status === 'graded' ? '已批改' : selectedAssignment.status === 'pending' ? '待批改' : '未提交'}
                  </p>
                </div>
              </div>

              {selectedAssignment.feedback && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest px-1">教师反馈</p>
                  <div className="p-6 bg-surface-alt rounded-[18px] border border-outline">
                    <p className="text-base font-medium text-ink leading-relaxed">
                      {selectedAssignment.feedback}
                    </p>
                  </div>
                </div>
              )}

              {submissionMap[selectedAssignment.id]?.remark && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest px-1">提交备注</p>
                  <div className="p-6 bg-surface-alt rounded-[18px] border border-outline">
                    <p className="text-base font-medium text-ink leading-relaxed whitespace-pre-wrap">
                      {submissionMap[selectedAssignment.id]?.remark}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  const submission = submissionMap[selectedAssignment.id];
                  if (submission?.fileUrl) {
                    window.open(submission.fileUrl, '_blank', 'noopener,noreferrer');
                    return;
                  }
                  toast.error('暂无文件');
                }}
                variant="secondary"
                size="lg"
                className="w-full rounded-full py-4"
              >
                <Download className="w-5 h-5 mr-3" />
                查看提交文件
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
