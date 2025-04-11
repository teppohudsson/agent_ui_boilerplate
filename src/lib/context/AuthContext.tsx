'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/lib/types/chat';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demonstration
const mockUser: User = {
  id: 'currentUser',
  name: 'Demo User',
  avatar: 'https://avatar.vercel.sh/demo'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a stored session
    const checkAuth = async () => {
      try {
        // In a real app, you would check localStorage, cookies, or an API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For demo purposes, we'll just set the user to null initially
        setUser(null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // In a real app, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo purposes, we'll just set the mock user
      setUser(mockUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // In a real app, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo purposes, we'll create a user with the provided name
      setUser({
        id: 'new-user-' + Date.now(),
        name,
        avatar: `https://avatar.vercel.sh/${name}`
      });
    } catch (error) {
      console.error('Signup failed:', error);
      throw new Error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // In a real app, you would clear tokens, cookies, etc.
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}