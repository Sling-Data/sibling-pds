import React, { createContext, useContext, useState, useEffect } from 'react';
import { TokenManager } from '../utils/TokenManager';

interface UserContextType {
  userId: string | null;
  isAuthenticated: boolean;
  setUserId: (userId: string | null) => void;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(TokenManager.getUserId());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(TokenManager.isTokenValid());

  useEffect(() => {
    // Check token validity on mount and update state
    const isValid = TokenManager.isTokenValid();
    const currentUserId = TokenManager.getUserId();
    setIsAuthenticated(isValid);
    setUserId(currentUserId);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    TokenManager.storeTokens({ accessToken, refreshToken });
    setUserId(TokenManager.getUserId());
    setIsAuthenticated(true);
  };

  const logout = () => {
    TokenManager.clearTokens();
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{ userId, isAuthenticated, setUserId, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;