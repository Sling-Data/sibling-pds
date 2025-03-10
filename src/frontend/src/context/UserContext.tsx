// @ts-expect-error React is used implicitly with JSX
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserState {
  userId: string | null;
  setUserId: (id: string | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  refreshToken: string | null;
  setRefreshToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const UserContext = createContext<UserState | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  initialUserId?: string | null;
  initialToken?: string | null;
  initialRefreshToken?: string | null;
}

export function UserProvider({ 
  children, 
  initialUserId = null, 
  initialToken = null, 
  initialRefreshToken = null 
}: UserProviderProps) {
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [token, setToken] = useState<string | null>(initialToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(initialRefreshToken);

  // Logout function to clear all auth data
  const logout = () => {
    setUserId(null);
    setToken(null);
    setRefreshToken(null);
  };

  const isAuthenticated = !!userId && !!token;

  const value = {
    userId,
    setUserId,
    token,
    setToken,
    refreshToken,
    setRefreshToken,
    isAuthenticated,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserState {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}