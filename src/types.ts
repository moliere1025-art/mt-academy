export type UserRole = 'student' | 'admin' | 'teacher';
export type MembershipLevel = 'Core' | 'Advanced' | 'Mastery' | 'Elite';

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isVerified?: boolean;
  membershipLevel?: MembershipLevel;
  learningGoal?: string;
  createdAt?: string;
}

export interface LessonModule {
  id?: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  resourceCount?: number;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  level: string;
  duration: string;
  students: number;
  progress?: number;
  image: string;
  category: string;
  price?: number;
  description?: string;
  videoUrl?: string;
  pdfUrl?: string;
  modules?: LessonModule[];
  isAccessible?: boolean;
  accessReason?: string;
  badge?: string;
  outline?: string[];
  productType?: 'course' | 'training' | 'certification';
  hasVideo?: boolean;
  isEnrolled?: boolean;
  lastLessonId?: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseId?: string;
  course?: string;
  description?: string;
  dueDate: string;
  status?: 'not_submitted' | 'pending' | 'graded';
  submittedAt?: string;
  score?: number | string;
  feedback?: string;
}

export interface LiveSession {
  id: string;
  title: string;
  date?: string;
  time?: string;
  instructor?: string;
  status?: string;
  type?: string;
  replayUrl?: string;
}

export interface Resource {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'zip' | 'code' | 'excel' | 'video' | 'document';
  date: string;
  url?: string;
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  source?: 'course' | 'lesson';
  level?: string;
  isAccessible?: boolean;
  accessReason?: string;
}

export interface Enrollment {
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

export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  pendingAssignments: number;
  upcomingLive: number;
  averageProgress: number;
}

export function isStaffRole(role?: string | null) {
  return role === 'admin' || role === 'teacher';
}
