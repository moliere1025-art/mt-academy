import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Assignment, Course, LiveSession, Resource, User } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

function getAuthToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

// ── 请求拦截器：自动注入 JWT ──
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── 响应拦截器：全局错误处理 ──
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const serverMsg = error.response?.data?.error || error.response?.data?.message;

    if (status === 401) {
      // Token 过期、无效或用户已删除 → 自动登出
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // 仅在非登录请求时提示（登录失败由组件自行处理）
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        toast.error('登录已过期，请重新登录');
        // 延迟跳转，让 toast 显示
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      }
    } else if (status === 404 && (error.config?.url || '').includes('/auth/me')) {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      toast.error('账号已失效，请重新登录');
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } else if (status === 403) {
      toast.error(serverMsg || '没有权限执行此操作');
    } else if (status === 404) {
      // 404 通常由业务逻辑处理，不全局 toast
    } else if (status === 409) {
      toast.error(serverMsg || '数据冲突，请刷新后重试');
    } else if (status && status >= 500) {
      toast.error(serverMsg || '服务器错误，请稍后重试');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('请求超时，请检查网络连接');
    } else if (!error.response) {
      toast.error('网络连接失败，请检查网络');
    }

    return Promise.reject(error);
  },
);

export interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CoursePayload {
  title: string;
  instructor: string;
  price: number;
  description?: string;
  category?: string;
  level?: string;
  duration?: string;
  image?: string;
  videoUrl?: string;
  pdfUrl?: string;
  modules?: unknown[] | string;
}

export interface SubmissionRecord {
  id: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseTitle?: string;
  studentName: string;
  fileUrl?: string;
  remark?: string;
  submittedAt: string;
  grade?: string;
  feedback?: string;
  gradedAt?: string;
}

export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  pendingAssignments: number;
  upcomingLive: number;
  averageProgress: number;
}

export interface EnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  lastLessonId?: string;
  enrolledAt?: string;
  completedAt?: string;
  courseTitle?: string;
  courseImage?: string;
  instructor?: string;
  level?: string;
  duration?: string;
  hasVideo?: boolean;
}

export interface ProfilePayload {
  name: string;
  avatar?: string;
  learningGoal?: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

export const apiService = {
  login: (data: AuthPayload) => api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  register: (data: AuthPayload) => api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  getCurrentUser: () => api.get<ApiResponse<User>>('/auth/me'),
  updateProfile: (data: ProfilePayload) => api.put<ApiResponse<User>>('/auth/profile', data),
  updatePassword: (data: UpdatePasswordPayload) => api.put<ApiResponse<null>>('/auth/password', data),
  verifyStudent: (formData: FormData) => api.post('/auth/verify-student', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  getCourses: () => api.get<Course[]>('/courses'),
  getCourse: (id: string) => api.get<Course>(`/courses/${id}`),
  createCourse: (data: CoursePayload) => api.post<Course>('/courses', data),
  updateCourse: (id: string, data: CoursePayload) => api.put<Course>(`/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),

  getAssignments: () => api.get<Assignment[]>('/assignments'),
  getResources: () => api.get<Resource[]>('/resources'),
  getSubmissions: () => api.get<SubmissionRecord[]>('/submissions'),
  submitHomework: (formData: FormData) => api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  gradeSubmission: (id: string, data: { grade?: string; feedback?: string }) => api.post(`/submissions/${id}/grade`, data),

  getLiveSessions: () => api.get<LiveSession[]>('/live/sessions'),
  createLiveSession: (data: LiveSession) => api.post<LiveSession>('/live/sessions', data),
  updateLiveSession: (id: string, data: Partial<LiveSession>) => api.put<LiveSession>(`/live/sessions/${id}`, data),
  deleteLiveSession: (id: string) => api.delete(`/live/sessions/${id}`),

  getUsers: () => api.get<User[]>('/users'),
  updateUser: (id: string, data: Partial<User>) => api.put<ApiResponse<User>>(`/auth/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),

  createAssignment: (data: { title: string; courseId: string; description?: string; dueDate?: string }) =>
    api.post<Assignment>('/assignments', data),
  updateAssignment: (id: string, data: Partial<Assignment>) => api.put<Assignment>(`/assignments/${id}`, data),
  deleteAssignment: (id: string) => api.delete(`/assignments/${id}`),

  uploadImage: (formData: FormData) => api.post<{ success: boolean; key: string; url: string }>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadVideo: (formData: FormData) => api.post<{ success: boolean; key: string; url: string }>('/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadSubmission: (formData: FormData) => api.post<{ success: boolean; key: string; url: string }>('/upload/submission', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // ── 选课 & 进度 ──
  getEnrollments: () => api.get<EnrollmentRecord[]>('/enrollments'),
  enrollCourse: (courseId: string) => api.post(`/enrollments/${courseId}`),
  updateProgress: (courseId: string, data: { progress: number; lastLessonId?: string }) =>
    api.put(`/enrollments/${courseId}/progress`, data),
  getDashboardStats: () => api.get<DashboardStats>('/dashboard/stats'),
};
