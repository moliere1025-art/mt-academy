import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationContextType {
  navigate: (to: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigateRouter = useNavigate();

  const navigate = (to: string) => {
    navigateRouter(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider value={{ navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
