import React, { createContext, useContext, useState, useEffect } from 'react';
import { ManagerSession } from '../types';
import {
  getSession,
  setSession,
  clearSession,
  isAuthenticated as checkIsAuthenticated,
} from '../services/storageService';
import { MANAGER_CREDENTIALS, validateCredentials } from '../config/managerCredentials';

interface AuthContextType {
  user: ManagerSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, phone: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronous session initialization directly from storage to prevent auth flashing on refresh
  const [user, setUser] = useState<ManagerSession | null>(() => {
    try {
      return getSession();
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Cross-tab and storage synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hh_events_manager_session_v4') {
        try {
          const updated = getSession();
          setUser(updated);
        } catch (err) {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, phone: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Natural UX micro-delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      const isValid = validateCredentials(email, phone, pass);
      if (!isValid) {
        throw new Error('Invalid manager credentials');
      }

      const session: ManagerSession = {
        email: MANAGER_CREDENTIALS.email,
        name: MANAGER_CREDENTIALS.name,
        loginTime: new Date().toISOString(),
        token: `mng_tok_${Date.now()}`,
      };

      setSession(session);
      setUser(session);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
