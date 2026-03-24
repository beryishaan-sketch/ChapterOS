import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await client.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
        setOrg(res.data.data.org);
      }
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('token', res.data.data.token);
      setUser(res.data.data.member);
      setOrg(res.data.data.member.org);
      return { success: true };
    }
    return { success: false, error: res.data.error };
  };

  const register = async (payload) => {
    const res = await client.post('/auth/register', payload);
    if (res.data.success) {
      localStorage.setItem('token', res.data.data.token);
      setUser(res.data.data.member);
      setOrg(res.data.data.org);
      return { success: true };
    }
    return { success: false, error: res.data.error };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setOrg(null);
    window.location.href = '/login';
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, org, loading, login, logout, register, updateUser, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
