'use client';

import { useState, useEffect, useCallback } from 'react';
import { storeApi, adminApi } from '@/lib/api-client';
import type { Customer, User } from '@/types';

interface AuthState {
  user: Customer | User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      // Try admin token first
      const adminToken = localStorage.getItem('admin_token');
      const storeToken = localStorage.getItem('store_token');
      
      if (adminToken) {
        adminApi.setToken(adminToken);
        const res = await adminApi.get<{ user: User }>('/auth/me');
        if (res.success && res.data) {
          setState({
            user: res.data.user,
            isAuthenticated: true,
            isAdmin: true,
            loading: false,
            error: null,
          });
          return;
        }
      }
      
      if (storeToken) {
        storeApi.setToken(storeToken);
        const res = await storeApi.get<{ customer: Customer }>('/auth/me');
        if (res.success && res.data) {
          setState({
            user: res.data.customer,
            isAuthenticated: true,
            isAdmin: false,
            loading: false,
            error: null,
          });
          return;
        }
      }
      
      // No valid token
      setState({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null,
      });
    } catch {
      // Token invalid
      localStorage.removeItem('admin_token');
      localStorage.removeItem('store_token');
      setState({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string, isAdminLogin = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const api = isAdminLogin ? adminApi : storeApi;
      const endpoint = isAdminLogin ? '/auth/login' : '/auth/login';
      const res = await api.post<{ token: string; user?: User; customer?: Customer }>(endpoint, { email, password });
      
      if (res.success && res.data) {
        const token = res.data.token;
        const tokenKey = isAdminLogin ? 'admin_token' : 'store_token';
        localStorage.setItem(tokenKey, token);
        api.setToken(token);
        
        setState({
          user: res.data.user || res.data.customer || null,
          isAuthenticated: true,
          isAdmin: isAdminLogin,
          loading: false,
          error: null,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Login failed',
      }));
      return false;
    }
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await storeApi.post<{ token: string; customer: Customer }>('/auth/register', data);
      if (res.success && res.data) {
        localStorage.setItem('store_token', res.data.token);
        storeApi.setToken(res.data.token);
        setState({
          user: res.data.customer,
          isAuthenticated: true,
          isAdmin: false,
          loading: false,
          error: null,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Registration failed',
      }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('store_token');
    adminApi.setToken(null);
    storeApi.setToken(null);
    setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
      error: null,
    });
  };

  return { ...state, login, register, logout, checkAuth };
}
