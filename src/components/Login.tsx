import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function Login() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login({
          email: formData.email.trim(),
          password: formData.password,
          rememberMe,
        });
        toast.success('登录成功');
      } else {
        const name = formData.name.trim();
        if (name.length < 2) {
          toast.error('姓名至少 2 个字符');
          return;
        }
        await register({
          email: formData.email.trim(),
          password: formData.password,
          name,
          rememberMe,
        });
        toast.success('注册完成，已自动登录');
      }
    } catch (error: any) {
      console.error('[Login] submit error', error);
      const debugMsg = error.response?.data?.debug;
      const mainMsg = error.response?.data?.error || error.message || '操作失败，请重试';
      toast.error(`${mainMsg}${debugMsg ? ` (${debugMsg})` : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1a1a1a] p-4 md:p-8 font-sans selection:bg-white selection:text-black">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1100px] aspect-[16/10] bg-black rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col md:flex-row relative border border-white/5"
      >
        {/* Left Side - Brand & Visual */}
        <div className="w-full md:w-1/2 h-full relative p-12 flex flex-col justify-between border-r border-white/5 overflow-hidden">
          {/* Logo */}
          <div className="relative z-10">
            <h2 className="text-white text-xl font-bold tracking-tight">MT</h2>
          </div>

          {/* Large Star Visual */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[80%] h-[80%]">
              <path d="M200 0V400" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
              <path d="M0 200H400" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
              <path d="M58.5786 58.5786L341.421 341.421" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
              <path d="M341.421 58.5786L58.5786 341.421" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
              {/* Central Star Shape */}
              <path d="M200 120L215 185L280 200L215 215L200 280L185 215L120 200L185 185L200 120Z" fill="white" />
              {/* Lines radiating from center */}
              <line x1="200" y1="160" x2="200" y2="40" stroke="white" strokeWidth="4" />
              <line x1="200" y1="240" x2="200" y2="360" stroke="white" strokeWidth="4" />
              <line x1="160" y1="200" x2="40" y2="200" stroke="white" strokeWidth="4" />
              <line x1="240" y1="200" x2="360" y2="200" stroke="white" strokeWidth="4" />
            </svg>
          </div>

          {/* Footer Text */}
          <div className="relative z-10">
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-medium">
              © MT ACADEMY 2026. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 h-full bg-[#0d0d0d] p-12 md:p-20 flex flex-col relative">
          {/* Top Action */}
          <div className="absolute top-12 right-12">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/40 text-[11px] uppercase tracking-widest hover:text-white transition-colors font-medium"
            >
              {isLogin ? '创建账号' : '返回登录'}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-12"
            >
              <h1 className="text-white text-5xl font-light tracking-tight">
                {isLogin ? '登录' : '注册'}
              </h1>

              <form onSubmit={handleSubmit} className="space-y-10">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium">姓名</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-white text-base font-light focus:border-white transition-all outline-none placeholder:text-white/10"
                        placeholder="请输入姓名"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium">邮箱</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 py-3 text-white text-base font-light focus:border-white transition-all outline-none placeholder:text-white/10"
                    placeholder="mark.johnson@gmail.com"
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium">密码</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 py-3 text-white text-base font-light focus:border-white transition-all outline-none placeholder:text-white/10 tracking-[0.3em]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 bottom-3 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-4 h-4 rounded-full border border-white/20 flex items-center justify-center transition-all",
                      rememberMe ? "bg-white border-white" : "group-hover:border-white/40"
                    )}>
                      {rememberMe && <Check className="w-2.5 h-2.5 text-black stroke-[4]" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-white/40 text-[11px] font-medium group-hover:text-white/60 transition-colors">记住我</span>
                  </label>
                  <button type="button" className="text-white/40 text-[11px] font-medium hover:text-white transition-colors">
                    忘记密码？
                  </button>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center group hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                  >
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-tighter leading-none">
                        {isLoading ? '...' : isLogin ? '登录' : '注册'}
                      </p>
                    </div>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
