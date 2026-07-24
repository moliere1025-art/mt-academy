import { useState } from 'react';
import { Search, Moon, Sun, Menu, BookOpen, Video, FileText, LayoutGrid, Shield } from 'lucide-react';
import Button from './ui/Button';
import { cn, levelLabel } from '../lib/utils';
import { useNavigation } from '../contexts/NavigationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isStaffRole } from '../types';

interface TopNavProps {
  onMenuClick?: () => void;
  isCollapsed: boolean;
}

export default function TopNav({ onMenuClick, isCollapsed }: TopNavProps) {
  const { navigate } = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isStaff = isStaffRole(user?.role);
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');

  const quickLinks = isStaff
    ? [
        { label: '首页', path: '/admin', icon: LayoutGrid },
        { label: '课程', path: '/admin/courses', icon: BookOpen },
        { label: '直播', path: '/admin/live', icon: Video },
      ]
    : [
        { label: '课程', path: '/courses', icon: BookOpen },
        { label: '作业', path: '/assignments', icon: FileText },
        { label: '直播', path: '/live', icon: Video },
      ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = search.trim();
    if (isStaff) {
      navigate(q ? `/admin/courses?q=${encodeURIComponent(q)}` : '/admin/courses');
    } else {
      navigate(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses');
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-40 bg-nav-bg backdrop-blur-[20px] saturate-[180%] h-16 px-4 sm:px-6 md:px-10 flex justify-between items-center transition-all duration-300 ease-in-out border-b border-nav-border',
        isCollapsed ? 'lg:left-[72px]' : 'lg:left-[220px]'
      )}
    >
      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
        <button
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-sidebar-hover transition-colors text-ink shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="w-4 h-4" />
        </button>

        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center bg-surface-alt/80 rounded-full px-3.5 py-1.5 w-full max-w-[280px] transition-all focus-within:bg-surface group border border-outline/70 focus-within:border-primary/30"
        >
          <Search className="text-ink-muted w-3.5 h-3.5 mr-2.5 group-focus-within:text-ink transition-colors shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[12px] w-full placeholder:text-ink-muted font-medium tracking-tight text-ink outline-none"
            placeholder={isStaff ? '搜索课程…' : '搜索课程…'}
            type="search"
            enterKeyHint="search"
          />
        </form>

        <div className="hidden lg:flex items-center gap-1">
          {quickLinks.map((link) => (
            <Button
              key={link.path}
              onClick={() => navigate(link.path)}
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-md flex items-center gap-2 text-ink-muted hover:text-ink transition-all group hover:bg-sidebar-hover text-[12px] font-medium"
            >
              <link.icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
        <div className="hidden sm:flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
          <Shield className="w-3 h-3 text-primary mr-2" />
          <span className="text-[10px] font-bold text-primary tracking-widest">
            {isAdmin ? '管理员' : user?.role === 'teacher' ? '老师' : levelLabel(user?.membershipLevel)}
          </span>
        </div>

        <button
          onClick={() => navigate(isAdmin ? '/admin/settings' : '/profile')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-sidebar-hover transition-all text-ink-muted hover:text-ink"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-sidebar-hover transition-all text-ink-muted hover:text-ink"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
