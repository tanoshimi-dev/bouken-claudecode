'use client';

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { setUser, clearUser, setLoading } from '@/store/authSlice';
import { apiClient } from '@/lib/api';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiClient.getMe();
        dispatch(setUser(res.data));
      } catch {
        dispatch(clearUser());
      }
    }
    fetchUser();
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // ignore errors
    }
    dispatch(clearUser());
    window.location.href = '/login';
  }, [dispatch]);

  return { user, isAuthenticated, isLoading, logout };
}
