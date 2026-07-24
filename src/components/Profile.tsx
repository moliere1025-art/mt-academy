import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Clock,
  FileCheck,
  Tv,
  BookOpen,
  Lock,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { useNavigation } from '../contexts/NavigationContext';
import { toast } from 'sonner';
import { apiService, SubmissionRecord } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Assignment, Course, LiveSession } from '../types';

interface ProfileProps {
  onLogout?: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  const { navigate } = useNavigation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPasswordDraft, setCurrentPasswordDraft] = useState('');
  const [newPasswordDraft, setNewPasswordDraft] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop');
  const [displayNameDraft, setDisplayNameDraft] = useState(user?.name || '');
  const [learningGoalDraft, setLearningGoalDraft] = useState(user?.learningGoal || '完成当前课程学习、参与直播答疑，并按时提交作业。');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    setAvatarUrl(user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop');
    setDisplayNameDraft(user?.name || '');
    setLearningGoalDraft(user?.learningGoal || '完成当前课程学习、参与直播答疑，并按时提交作业。');
  }, [user?.avatar, user?.learningGoal, user?.name]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [assignmentsResponse, submissionsResponse, coursesResponse, liveSessionsResponse] = await Promise.all([
          apiService.getAssignments(),
          apiService.getSubmissions(),
          apiService.getCourses(),
          apiService.getLiveSessions(),
        ]);

        const assignmentList = Array.isArray(assignmentsResponse.data) ? assignmentsResponse.data : [];
        const submissions = Array.isArray(submissionsResponse.data) ? submissionsResponse.data : [];
        const courseList = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
        const submissionMap = new Map<string, SubmissionRecord>(
          submissions.map((submission) => [submission.assignmentId, submission])
        );

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
        setCourses(courseList);
        setLiveSessions(Array.isArray(liveSessionsResponse.data) ? liveSessionsResponse.data : []);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        toast.error('获取个人学习数据失败');
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const membershipLabel =
    user?.role === 'admin' ? '管理员' : user?.role === 'teacher' ? '授课老师' : user?.membershipLevel || '初级';
  const availableCourses = useMemo(
    () => courses.filter((course) => course.isAccessible !== false),
    [courses]
  );
  const completedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'graded').length,
    [assignments]
  );
  const pendingAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'pending' || assignment.status === 'not_submitted' || !assignment.status).length,
    [assignments]
  );
  const replayReadyCount = useMemo(
    () => liveSessions.filter((session) => !!session.replayUrl).length,
    [liveSessions]
  );
  const nextLiveCount = useMemo(
    () => liveSessions.filter((session) => !session.replayUrl).length,
    [liveSessions]
  );
  const availableCourseCount = availableCourses.length;

  const learningProfile = useMemo(() => ({
    displayName: user?.name || '学员',
    status: user?.isVerified ? '已认证学员' : '待认证',
    memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '—',
    learningGoal: learningGoalDraft,
  }), [learningGoalDraft, user]);

  const stats = useMemo(() => ([
    { label: '待完成作业', value: String(pendingAssignments), unit: '项', icon: Clock, color: 'text-primary' },
    { label: '已完成作业', value: String(completedAssignments), unit: '份', icon: FileCheck, color: 'text-secondary' },
    { label: '直播安排', value: String(nextLiveCount), unit: '场', icon: Tv, color: 'text-amber-500' },
    { label: '可学课程', value: String(availableCourseCount), unit: '门', icon: BookOpen, color: 'text-emerald-500' },
  ]), [availableCourseCount, completedAssignments, nextLiveCount, pendingAssignments]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择有效的图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Avatars: prefer data URL fallback if staff-only upload rejects students
      let newUrl = '';
      try {
        const response = await apiService.uploadImage(formData);
        newUrl = response.data.url || (response.data as any).key || '';
      } catch {
        newUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('read failed'));
          reader.readAsDataURL(file);
        });
      }
      if (!newUrl) throw new Error('empty avatar url');
      setAvatarUrl(newUrl);

      if (user) {
        const profileResponse = await apiService.updateProfile({
          name: user.name,
          avatar: newUrl,
          learningGoal: user.learningGoal,
        });
        updateUser(profileResponse.data.data);
      }

      toast.success('头像更新成功！');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('头像上传失败，请重试');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = displayNameDraft.trim();
    const trimmedLearningGoal = learningGoalDraft.trim();
    if (!trimmedName) {
      toast.error('请输入展示名称');
      return;
    }

    if (!trimmedLearningGoal) {
      toast.error('请输入学习目标');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiService.updateProfile({
        name: trimmedName,
        avatar: avatarUrl,
        learningGoal: trimmedLearningGoal,
      });
      updateUser(response.data.data);
      setIsEditModalOpen(false);
      toast.success('个人资料更新成功！');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('个人资料更新失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    const trimmedCurrentPassword = currentPasswordDraft.trim();
    const trimmedNewPassword = newPasswordDraft.trim();

    if (!trimmedCurrentPassword || !trimmedNewPassword) {
      toast.error('请填写当前密码和新密码');
      return;
    }

    if (trimmedNewPassword.length < 6) {
      toast.error('新密码长度不能少于 6 位');
      return;
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
      toast.error('新密码不能与当前密码相同');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiService.updatePassword({
        currentPassword: trimmedCurrentPassword,
        newPassword: trimmedNewPassword,
      });
      setCurrentPasswordDraft('');
      setNewPasswordDraft('');
      setIsSecurityModalOpen(false);
      toast.success('密码更新成功');
    } catch (error: any) {
      console.error('Password update error:', error);
      const message = error?.response?.data?.error || '密码更新失败，请重试';
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      toast.success('已安全退出登录');
    }
  };

  return (
    <div className="edu-page">
      <div className="edu-shell">
        {/* Hero — Personal Info Card */}
        <div className="edu-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <div
                onClick={handleAvatarClick}
                className="w-20 h-20 rounded-full overflow-hidden border border-outline cursor-pointer relative"
              >
                <img
                  src={user?.avatar || avatarUrl}
                  alt="头像"
                  className={cn(
                    'w-full h-full object-cover transition-all duration-300 group-hover:scale-105',
                    isUploading && 'opacity-50 blur-sm'
                  )}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <span className="text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    更换头像
                  </span>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <h1 className="edu-title">
                {user?.name || '学员'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                <span>{user?.isVerified ? '已认证学员' : '待认证'}</span>
                <span className="w-1 h-1 rounded-full bg-outline" />
                <span>{membershipLabel} 计划</span>
                <span className="w-1 h-1 rounded-full bg-outline" />
                <span>{learningProfile.memberSince} 年加入</span>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              className="rounded-full px-6 shrink-0"
            >
              编辑资料
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {isDataLoading ? (
          <div className="edu-card p-12 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="edu-card p-3.5 space-y-2 hover:bg-surface-alt transition-colors"
              >
                <stat.icon className={cn('w-5 h-5', stat.color)} />
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-ink leading-none">
                    {stat.value}
                    <span className="text-sm font-normal text-ink-muted ml-1">{stat.unit}</span>
                  </p>
                  <p className="text-xs text-ink-muted mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Grid — Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Learning Access */}
            <div className="edu-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="edu-section-title">学习权限</h2>
                <Button
                  onClick={() => navigate('/courses')}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                >
                  查看课程
                </Button>
              </div>
              <div className="edu-card-soft p-5 space-y-4">
                <div>
                  <p className="text-xs text-ink-muted mb-1">当前权限</p>
                  <p className="text-xl font-bold tracking-tight text-ink">
                    {user?.role === 'admin' ? '管理员' : membershipLabel}
                  </p>
                </div>
                <div className="flex justify-between items-end gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-ink-muted mb-0.5">可学课程</p>
                    <p className="text-sm font-bold text-ink">{availableCourseCount} 门</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-muted mb-0.5">可回放</p>
                    <p className="text-sm font-bold text-emerald-600">{replayReadyCount} 场</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="edu-card p-4 space-y-3">
              <h2 className="edu-section-title">安全设置</h2>
              <button
                onClick={() => setIsSecurityModalOpen(true)}
                className="w-full flex items-center justify-between p-4 edu-card-soft hover:bg-surface-alt transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-ink-muted" />
                  <span className="text-sm font-medium text-ink">修改密码</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Study Focus */}
            <div className="edu-card p-4 space-y-3">
              <h2 className="edu-section-title">学习重点</h2>
              <div className="edu-card-soft p-5 space-y-2">
                <p className="text-xs text-ink-muted">当前目标</p>
                <p className="text-sm font-medium text-ink leading-relaxed">{learningProfile.learningGoal}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="edu-card-soft p-4 space-y-1">
                  <p className="text-xs text-ink-muted">待完成作业</p>
                  <p className="text-2xl font-bold tracking-tight text-ink">{pendingAssignments}</p>
                </div>
                <div className="edu-card-soft p-4 space-y-1">
                  <p className="text-xs text-ink-muted">直播安排</p>
                  <p className="text-2xl font-bold tracking-tight text-ink">{nextLiveCount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/assignments')}
                  variant="secondary"
                  className="rounded-full w-full text-xs"
                >
                  查看作业
                </Button>
                <Button
                  onClick={() => navigate('/live')}
                  variant="primary"
                  className="rounded-full w-full text-xs"
                >
                  直播安排
                </Button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="edu-card p-4 space-y-3">
              <h2 className="edu-section-title">账号操作</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="secondary"
                  className="rounded-full w-full text-xs py-4"
                >
                  编辑资料
                </Button>
                <Button
                  onClick={() => setIsLogoutModalOpen(true)}
                  variant="primary"
                  className="rounded-full w-full text-xs py-4 bg-danger hover:bg-danger/90"
                >
                  退出登录
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑个人资料">
        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">显示名称</label>
            <input
              type="text"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              className="w-full border border-outline rounded-xl p-3 text-sm text-ink bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">学习目标</label>
            <textarea
              value={learningGoalDraft}
              onChange={(e) => setLearningGoalDraft(e.target.value)}
              rows={3}
              className="w-full border border-outline rounded-xl p-3 text-sm text-ink bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            variant="primary"
            className="w-full rounded-full"
            disabled={isSaving}
          >
            {isSaving ? '保存中…' : '保存修改'}
          </Button>
        </div>
      </Modal>

      {/* Security Modal */}
      <Modal isOpen={isSecurityModalOpen} onClose={() => {
        if (isUpdatingPassword) return;
        setIsSecurityModalOpen(false);
      }} title="修改密码">
        <div className="space-y-3 p-4">
          <div className="space-y-3">
            <input
              type="password"
              placeholder="当前密码"
              value={currentPasswordDraft}
              onChange={(e) => setCurrentPasswordDraft(e.target.value)}
              className="w-full border border-outline rounded-xl p-3 text-sm text-ink bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <input
              type="password"
              placeholder="新密码"
              value={newPasswordDraft}
              onChange={(e) => setNewPasswordDraft(e.target.value)}
              className="w-full border border-outline rounded-xl p-3 text-sm text-ink bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <Button
            onClick={handleUpdatePassword}
            variant="primary"
            className="w-full rounded-full"
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? '更新中…' : '更新密码'}
          </Button>
        </div>
      </Modal>

      {/* Logout Confirm Modal */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="确认退出">
        <div className="space-y-8 p-4 text-center">
          <div className="space-y-3">
            <h3 className="text-xl font-bold tracking-tight text-ink">确定退出登录？</h3>
            <p className="text-sm text-ink-muted">退出后需重新登录才能继续学习。</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsLogoutModalOpen(false)}
              variant="secondary"
              className="flex-1 rounded-full"
            >
              取消
            </Button>
            <Button
              onClick={handleLogout}
              variant="primary"
              className="flex-1 rounded-full bg-danger hover:bg-danger/90"
            >
              确认退出
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
