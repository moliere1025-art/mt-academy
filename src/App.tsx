import React, { Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
const Dashboard = lazy(() => import('./components/Dashboard'));
const CourseLibrary = lazy(() => import('./components/CourseLibrary'));
const LiveStream = lazy(() => import('./components/LiveStream'));
const Profile = lazy(() => import('./components/Profile'));
import Login from './components/Login';
const Assignments = lazy(() => import('./components/Assignments'));
const LessonView = lazy(() => import('./components/LessonView'));
const AdminAssignmentsPage = lazy(() => import('./components/admin/AdminAssignmentsPage'));
const AdminCourseEditorPage = lazy(() => import('./components/admin/AdminCourseEditorPage'));
const AdminCoursesPage = lazy(() => import('./components/admin/AdminCoursesPage'));
const AdminHomePage = lazy(() => import('./components/admin/AdminHomePage'));
const AdminLivePage = lazy(() => import('./components/admin/AdminLivePage'));
const AdminSettingsPage = lazy(() => import('./components/admin/AdminSettingsPage'));
const AdminStudentsPage = lazy(() => import('./components/admin/AdminStudentsPage'));
const Resources = lazy(() => import('./components/Resources'));
import Footer from './components/Footer';
import { NavigationProvider } from './contexts/NavigationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useSidebarAutoCollapse } from './hooks/useSidebarAutoCollapse';
import { isStaffRole } from './types';

/** 教务后台守卫 — admin / teacher 可进；学生跳转学习首页 */
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!isStaffRole(user?.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** 仅管理员（学生管理 / 系统设置） */
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isSidebarCollapsed = useSidebarAutoCollapse();
  const { isLoggedIn, isAuthReady, user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaff = isStaffRole(user?.role);

  const routeFallback = (
    <div className="flex items-center justify-center h-[70vh] px-6">
      <div className="w-full max-w-md rounded-[18px] border border-outline bg-surface px-8 py-10 text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-[13px] font-medium text-ink-muted">正在载入页面...</p>
      </div>
    </div>
  );

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-app font-sans">
        <Toaster position="top-right" richColors theme={theme as 'light' | 'dark'} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 mb-8 relative">
            <div className="absolute inset-0 border-4 border-outline rounded-full" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
            />
          </div>
          <h2 className="text-[24px] font-display font-[600] tracking-tight text-ink mb-2">MT</h2>
          <p className="text-[14px] text-ink-muted font-medium tracking-tight">正在初始化...</p>
        </motion.div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" richColors theme={theme as 'light' | 'dark'} />
        <Login />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-app selection:bg-primary/10 selection:text-ink overflow-x-hidden">
      <Toaster position="top-right" richColors theme={theme as 'light' | 'dark'} />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
      />

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <TopNav
        onMenuClick={() => setIsSidebarOpen(true)}
        isCollapsed={isSidebarCollapsed}
      />

      <main className={cn(
        "pt-16 min-h-screen flex flex-col transition-all duration-300 ease-in-out w-full",
        isSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[220px]"
      )}>
        <div className="w-full flex-1 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={routeFallback}>
                <Routes>
                  <Route path="/" element={<Navigate to={isStaff ? '/admin' : '/dashboard'} replace />} />
                  <Route path="/dashboard" element={isStaff ? <Navigate to="/admin" replace /> : <Dashboard />} />
                  <Route path="/courses" element={<CourseLibrary />} />
                  <Route path="/courses/:courseId" element={<LessonView />} />
                  <Route path="/courses/:courseId/learn/:lessonId" element={<LessonView />} />
                  <Route path="/live" element={<LiveStream />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/profile" element={<Profile onLogout={() => logout()} />} />

                  <Route path="/admin" element={<StaffRoute><AdminHomePage /></StaffRoute>} />
                  <Route path="/admin/courses" element={<StaffRoute><AdminCoursesPage /></StaffRoute>} />
                  <Route path="/admin/courses/new" element={<StaffRoute><AdminCourseEditorPage mode="create" /></StaffRoute>} />
                  <Route path="/admin/courses/:courseId" element={<StaffRoute><AdminCourseEditorPage mode="edit" /></StaffRoute>} />
                  <Route path="/admin/students" element={<AdminOnlyRoute><AdminStudentsPage /></AdminOnlyRoute>} />
                  <Route path="/admin/assignments" element={<StaffRoute><AdminAssignmentsPage /></StaffRoute>} />
                  <Route path="/admin/live" element={<StaffRoute><AdminLivePage /></StaffRoute>} />
                  <Route path="/admin/settings" element={<AdminOnlyRoute><AdminSettingsPage /></AdminOnlyRoute>} />

                  <Route path="*" element={<Navigate to={isStaff ? '/admin' : '/dashboard'} replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {!isAdminRoute && <Footer />}
      </main>

      <div id="toast-root"></div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
