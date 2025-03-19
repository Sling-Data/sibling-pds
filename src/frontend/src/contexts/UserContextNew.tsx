import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';

/**
 * User Context - Manages user state only
 * 
 * This context is responsible for:
 * - Storing the current user profile and ID
 * - Maintaining loading and error states
 * - Providing methods to update user state
 * 
 * It does NOT:
 * - Make direct API calls (useUser hook handles this)
 * - Handle authentication (AuthContext handles this)
 */

interface UserState {
  user: User | null;
  userId: string | null;
  loading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
}

interface UserContextType extends UserState {
  // Methods to update state
  setUser: (user: User | null) => void;
  setUserId: (userId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  
  // Convenience methods
  updateUserState: (updates: Partial<UserState>) => void;
  
  // Reset method
  resetUserState: () => void;
}

const initialState: UserState = {
  user: null,
  userId: null,
  loading: false,
  error: null,
  hasCompletedOnboarding: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProviderNew: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserState>(initialState);

  // Individual setters
  const setUser = useCallback((user: User | null) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    setState(prev => ({ ...prev, userId }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setHasCompletedOnboarding = useCallback((hasCompletedOnboarding: boolean) => {
    setState(prev => ({ ...prev, hasCompletedOnboarding }));
  }, []);

  // Batch update method
  const updateUserState = useCallback((updates: Partial<UserState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset method
  const resetUserState = useCallback(() => {
    setState(initialState);
  }, []);

  const value = {
    ...state,
    setUser,
    setUserId,
    setLoading,
    setError,
    setHasCompletedOnboarding,
    updateUserState,
    resetUserState,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContextNew = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContextNew must be used within a UserProviderNew');
  }
  return context;
}; 