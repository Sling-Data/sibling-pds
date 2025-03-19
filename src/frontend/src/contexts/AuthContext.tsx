import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  isTokenValid, 
  getRefreshToken, 
  storeTokens, 
  clearTokens, 
  getUserId
} from '../utils/TokenManager';
import { AuthTokens } from '../types';

/**
 * Adapts received token format to our internal format
 * The backend sends "token" but we use "accessToken" internally
 */
const adaptAuthTokens = (tokens: any): AuthTokens => {
  // Create a new object with both token formats for compatibility
  return {
    token: tokens.token, // Keep original token
    accessToken: tokens.token || tokens.accessToken, // Prefer token from API but fallback to accessToken
    refreshToken: tokens.refreshToken,
    userId: tokens.userId,
    expiresIn: tokens.expiresIn
  };
};

interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  userId: string | null;
  isRefreshing: boolean;
  setAuthState: (state: { isAuthenticated: boolean; userId: string | null }) => void;
  storeAuthTokens: (tokens: any) => void;
  clearAuthTokens: () => void;
  setIsRefreshing: (isRefreshing: boolean) => void;
  getCurrentRefreshToken: () => string | null;
  handleTokenRefreshSuccess: (tokens: any) => void;
  handleTokenRefreshFailure: () => void;
  needsTokenRefresh: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [state, setState] = useState({
    isAuthenticated: isTokenValid(),
    isInitialized: false,
    userId: getUserId(),
  });

  const setAuthState = useCallback((newState: { isAuthenticated: boolean; userId: string | null }) => {
    setState(prev => ({
      ...prev,
      ...newState,
      isInitialized: true,
    }));
  }, []);

  const storeAuthTokens = useCallback((tokens: any) => {
    // Adapt the token format if needed
    const adaptedTokens = adaptAuthTokens(tokens);
    storeTokens(adaptedTokens);
    setAuthState({
      isAuthenticated: true,
      userId: getUserId(),
    });
  }, [setAuthState]);

  const clearAuthTokens = useCallback(() => {
    clearTokens();
    setAuthState({
      isAuthenticated: false,
      userId: null,
    });
  }, [setAuthState]);

  const getCurrentRefreshToken = useCallback(() => {
    return getRefreshToken();
  }, []);

  const handleTokenRefreshSuccess = useCallback((tokens: any) => {
    storeAuthTokens(tokens);
    return true;
  }, [storeAuthTokens]);

  const handleTokenRefreshFailure = useCallback(() => {
    // Can add additional logic here if needed when refresh fails
    return false;
  }, []);

  const needsTokenRefresh = useCallback(() => {
    return isTokenValid() && getRefreshToken() !== null;
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        ...state,
        isRefreshing,
        setAuthState, 
        storeAuthTokens, 
        clearAuthTokens,
        setIsRefreshing,
        getCurrentRefreshToken,
        handleTokenRefreshSuccess,
        handleTokenRefreshFailure,
        needsTokenRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 