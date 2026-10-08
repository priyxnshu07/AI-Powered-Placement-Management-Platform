import React, { useCallback, useEffect, useState } from 'react';
import { getMe, login as loginRequest } from '../api/auth';
import type { User } from '../types/api';
import { AuthContext } from './auth-context';

const TOKEN_KEY = 'placement_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data.data.user);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, [token, logout]);

  const login = async (email: string, password: string) => {
    const res = await loginRequest({ email, password });
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser.role;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
