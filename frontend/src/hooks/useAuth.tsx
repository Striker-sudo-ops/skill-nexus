import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, loginUser, registerUser } from '../services/api';

export interface User {
  id: number;
  email: string;
  role: 'STUDENT' | 'EMPLOYER' | 'ADMIN' | 'TRAINER';
  full_name?: string;
  company_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isStudent: boolean;
  isEmployer: boolean;
  isAdmin: boolean;
  isTrainer: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data.user);
        } catch (err) {
          console.error('Session expired or invalid token', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials: any) => {
    const res = await loginUser(credentials);
    const { access_token, user: loggedUser } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(loggedUser);
  };

  const register = async (userData: any) => {
    const res = await registerUser(userData);
    const { access_token, user: registeredUser } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(registeredUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isStudent: user?.role === 'STUDENT',
        isEmployer: user?.role === 'EMPLOYER',
        isAdmin: user?.role === 'ADMIN',
        isTrainer: user?.role === 'TRAINER',
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
