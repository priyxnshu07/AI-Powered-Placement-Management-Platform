import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'recruiter' | 'placement_officer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('placement_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (token) {
        try {
          const res = await client.get('/auth/me');
          setUser(res.data.data.user);
        } catch (err) {
          logout();
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('placement_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser.role;
  };

  const logout = () => {
    localStorage.removeItem('placement_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
