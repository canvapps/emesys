
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface DataSyncState {
  lastSync: Date | null;
  isSyncing: boolean;
  error: string | null;
}

export const useDataSync = () => {
  const [syncState, setSyncState] = useState<DataSyncState>({
    lastSync: null,
    isSyncing: false,
    error: null
  });
  const { isAuthenticated } = useAuth();

  const syncData = async () => {
    if (!isAuthenticated) return;

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Simulate data synchronization
      // In a real app, this would sync data between admin and frontend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSyncState({
        lastSync: new Date(),
        isSyncing: false,
        error: null
      });
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  };

  // Auto-sync every 5 minutes when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(syncData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Initial sync on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      syncData();
    }
  }, [isAuthenticated]);

  return {
    ...syncState,
    syncData
  };
};
