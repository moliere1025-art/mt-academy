import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthReady: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(user: User): User {
  if (user.role !== 'student') {
    return user;
  }

  return {
    ...user,
    membershipLevel: user.membershipLevel || 'Core',
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const persistUser = (nextUser: User | null) => {
    if (!nextUser) {
      localStorage.removeItem('user');
      setUser(null);
      return;
    }

    const normalizedUser = normalizeUser(nextUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  const clearAuthStorage = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      persistUser(null);
      return;
    }

    try {
      const response = await apiService.getCurrentUser();
      persistUser(response.data.data);
    } catch (error) {
      console.error('Refresh user error:', error);
      clearAuthStorage();
      persistUser(null);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = getToken();

      if (!token) {
        persistUser(null);
        setIsAuthReady(true);
        return;
      }

      if (savedUser) {
        try {
          setUser(normalizeUser(JSON.parse(savedUser)));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('user');
        }
      }

      try {
        await refreshUser();
      } catch {
        // token invalid or user no longer exists; refreshUser already cleared local state
      } finally {
        setIsAuthReady(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: any) => {
    try {
      console.log('[Auth] login request start', { email: data?.email });
      const response = await apiService.login(data);
      console.log('[Auth] login response', response?.data);
      const { token, user: userData } = response.data.data;
      const remember = data?.rememberMe !== false;
      // Remember Me: localStorage (persist) vs sessionStorage (tab session only)
      if (remember) {
        localStorage.setItem('auth_token', token);
        sessionStorage.removeItem('auth_token');
      } else {
        sessionStorage.setItem('auth_token', token);
        localStorage.removeItem('auth_token');
      }
      persistUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      console.log('[Auth] register request start', { email: data?.email, name: data?.name });
      const response = await apiService.register(data);
      console.log('[Auth] register response', response?.data);

      // Backend: { success, data: { token, user } }
      const payload: any = response.data?.data ?? response.data;
      let token = payload?.token as string | undefined;
      let userData = payload?.user as User | undefined;

      // Fallback: if register response shape is unexpected, immediately login
      if (!token || !userData) {
        const loginResponse = await apiService.login({
          email: data.email,
          password: data.password,
        });
        token = loginResponse.data?.data?.token;
        userData = loginResponse.data?.data?.user;
      }

      if (!token || !userData) {
        throw new Error('注册成功，但自动登录失败，请返回登录页重新登录');
      }

      const remember = data?.rememberMe !== false;
      if (remember) {
        localStorage.setItem('auth_token', token);
        sessionStorage.removeItem('auth_token');
      } else {
        sessionStorage.setItem('auth_token', token);
        localStorage.removeItem('auth_token');
      }
      persistUser(userData);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const updateUser = (nextUser: User) => {
    persistUser(nextUser);
  };

  const logout = () => {
    clearAuthStorage();
    persistUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAuthReady, login, register, refreshUser, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
