import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';

const Footer: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <footer className="mt-auto w-full bg-app/90 backdrop-blur-md border-t border-outline px-4 sm:px-8 md:px-12 py-3 flex items-center shrink-0">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-6">
            <p className="text-[12px] font-normal text-ink-muted">
              © 2026 MT Academy
            </p>
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate('/resources')} className="text-[12px] text-ink-muted hover:text-ink transition-colors">学习资料</button>
              <div className="w-px h-3 bg-outline"></div>
              <button onClick={() => navigate('/assignments')} className="text-[12px] text-ink-muted hover:text-ink transition-colors">作业中心</button>
              <div className="w-px h-3 bg-outline"></div>
              <button onClick={() => navigate('/live')} className="text-[12px] text-ink-muted hover:text-ink transition-colors">直播回放</button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              返回学习首页
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
