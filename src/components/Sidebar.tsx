import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  LayoutGrid,
  BookOpen,
  FileText,
  Video,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MembershipBadge } from './ui/Badge';
import { isStaffRole } from '../types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const NavButton = ({ item, isActive, isCollapsed, onClick }: { item: NavItem; isActive: boolean; isCollapsed: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    title={isCollapsed ? item.label : undefined}
    className={cn(
      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 relative active:scale-[0.98]',
      isActive
        ? 'bg-sidebar-active text-sidebar-ink shadow-sm'
        : 'text-sidebar-ink-muted hover:text-sidebar-ink hover:bg-sidebar-hover'
    )}
  >
    <item.icon
      className={cn(
        'w-[18px] h-[18px] shrink-0 transition-colors',
        isActive ? 'text-primary' : ''
      )}
    />
    {!isCollapsed && (
      <span className="text-[13px] font-medium tracking-tight truncate">
        {item.label}
      </span>
    )}
    {isCollapsed && isActive && (
      <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
    )}
  </button>
);

export default function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isStaff = isStaffRole(user?.role);

  const studentNavItems: NavItem[] = [
    { id: 'dashboard', label: '学习首页', icon: LayoutGrid, path: '/dashboard' },
    { id: 'courses', label: '课程中心', icon: BookOpen, path: '/courses' },
    { id: 'assignments', label: '我的作业', icon: FileText, path: '/assignments' },
    { id: 'resources', label: '学习资料', icon: FolderOpen, path: '/resources' },
    { id: 'live', label: '直播与回放', icon: Video, path: '/live' },
  ];

  const staffNavItems: NavItem[] = [
    { id: 'admin', label: '后台首页', icon: LayoutGrid, path: '/admin' },
    { id: 'admin-courses', label: '课程管理', icon: BookOpen, path: '/admin/courses' },
    ...(isAdmin
      ? [{ id: 'admin-students', label: '学生管理', icon: Users, path: '/admin/students' } as NavItem]
      : []),
    { id: 'admin-assignments', label: '作业管理', icon: FileText, path: '/admin/assignments' },
    { id: 'admin-live', label: '直播管理', icon: Video, path: '/admin/live' },
    ...(isAdmin
      ? [{ id: 'admin-settings', label: '系统设置', icon: Settings, path: '/admin/settings' } as NavItem]
      : []),
  ];

  const navItems = isStaff ? staffNavItems : studentNavItems;

  const isItemActive = (item: NavItem) => {
    if (item.path === '/dashboard' || item.path === '/admin') {
      return location.pathname === item.path;
    }
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <aside
      className={cn(
        'h-screen fixed left-0 top-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-[220px]',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center shrink-0 border-b border-sidebar-border',
        isCollapsed ? 'justify-center px-3 h-16' : 'px-5 h-16 gap-2'
      )}>
        <span className="font-display text-[22px] font-[600] tracking-[-0.02em] text-sidebar-ink select-none">
          MT
        </span>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[13px] font-medium text-sidebar-ink-muted tracking-tight"
          >
            Academy
          </motion.span>
        )}
      </div>

      {/* Nav Section */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-4">
        {!isCollapsed && (
          <p className="text-[11px] font-semibold tracking-wide text-sidebar-ink-muted px-3 mb-3">
            {isAdmin ? '管理台' : '学习'}
          </p>
        )}
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={isItemActive(item)}
              isCollapsed={isCollapsed}
              onClick={() => handleNavClick(item.path)}
            />
          ))}
        </nav>
      </div>

      {/* Footer — Theme + Logout */}
      <div className="shrink-0 px-3 py-3 space-y-0.5 border-t border-sidebar-border">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? '浅色模式' : '深色模式'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-ink-muted hover:text-sidebar-ink hover:bg-sidebar-hover transition-all active:scale-[0.98]"
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] shrink-0" />
          ) : (
            <Moon className="w-[18px] h-[18px] shrink-0" />
          )}
          {!isCollapsed && (
            <span className="text-[13px] font-medium">
              {theme === 'dark' ? '浅色模式' : '深色模式'}
            </span>
          )}
        </button>
        <button
          onClick={handleLogout}
          title="退出登录"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-ink-muted hover:text-danger hover:bg-danger/5 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span className="text-[13px] font-medium">退出登录</span>}
        </button>
      </div>

      {/* User Card */}
      <div className="shrink-0 px-3 pb-4 pt-1 border-t border-sidebar-border">
        <button
          onClick={() => {
            navigate(isAdmin ? '/admin/settings' : '/profile');
            onClose?.();
          }}
          className={cn(
            'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all',
            'hover:bg-sidebar-hover active:scale-[0.98] cursor-pointer',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img
                alt={user?.name || '用户'}
                className="w-8 h-8 rounded-full object-cover border border-sidebar-border"
                src={user.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sidebar-active border border-sidebar-border flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-ink-muted" />
              </div>
            )}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar',
                isAdmin ? 'bg-danger' : 'bg-success'
              )}
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold truncate text-sidebar-ink leading-tight">
                {user?.name || '用户'}
              </p>
              {isAdmin ? (
                <p className="text-[11px] text-sidebar-ink-muted tracking-wide mt-0.5">管理员</p>
              ) : (
                <MembershipBadge level={user?.membershipLevel} className="mt-1 text-[9px] px-1.5 py-0" />
              )}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
