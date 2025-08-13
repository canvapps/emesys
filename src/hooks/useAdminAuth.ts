
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthUser } from '@/utils/auth';

export const useAdminAuth = () => {
  const { user, isLoading, logout: authLogout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/admin/login');
      } else if (user && user.role !== 'admin') {
        // Regular users can't access admin panel
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const logout = async () => {
    await authLogout();
    navigate('/admin/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: isAuthenticated && user?.role === 'admin',
    logout
  };
};
