import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  shouldRefresh, 
  getRefreshToken, 
  storeTokens, 
  getUserId, 
  clearTokens, 
  isTokenValid,
  getAccessToken
} from '../utils/TokenManager';
import { useNavigate } from 'react-router-dom';

interface UserContextType {
  userId: string | null;
  isAuthenticated: boolean;
  setUserId: (userId: string | null) => void;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  refreshTokenIfExpired: () => Promise<boolean>;
  checkUserDataAndNavigate: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a custom hook that returns a navigate function or a no-op function
const useNavigateOrNoop = () => {
  try {
    // Try to use the real navigate function
    return useNavigate();
  } catch (error) {
    // Return a no-op function if useNavigate is not available (e.g., in tests)
    return (() => {}) as ReturnType<typeof useNavigate>;
  }
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(getUserId());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isTokenValid());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const navigate = useNavigateOrNoop();

  const login = useCallback((token: string, refreshToken: string) => {
    // First store the tokens
    storeTokens({ token, refreshToken });
    
    // Update the state immediately
    const userId = getUserId();
    setUserId(userId);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    clearTokens();
    setIsAuthenticated(false);
  }, []);

  const refreshTokenIfExpired = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing) {
      return true; // Another refresh is already in progress
    }

    // Check if token should be refreshed (less than 30 seconds remaining)
    if (!shouldRefresh()) {
      return true; // Token is still valid, no need to refresh
    }

    setIsRefreshing(true);
    
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token available, logout and redirect
        logout();
        navigate('/login');
        return false;
      }

      // Make request to refresh token endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // If server returns 401 or any error, logout and redirect
        logout();
        navigate('/login');
        return false;
      }

      // Parse response and update tokens
      const data = await response.json();
      if (data.token && data.refreshToken) {
        // Store tokens first
        storeTokens({
          token: data.token,
          refreshToken: data.refreshToken,
        });
        
        // Then update state with a small delay to ensure tokens are saved
        setTimeout(() => {
          const userId = getUserId();
          setUserId(userId);
          setIsAuthenticated(true);
        }, 50);
        
        return true;
      } else {
        // Invalid response format
        logout();
        navigate('/login');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      navigate('/login');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [navigate, logout, isRefreshing]);

  // Function to check if user has volunteered data and navigate accordingly
  const checkUserDataAndNavigate = useCallback(async () => {
    const currentUserId = getUserId();
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    // Check if token is valid before making the request
    if (!isTokenValid()) {
      // Try to refresh the token first
      const refreshSuccessful = await refreshTokenIfExpired();
      if (!refreshSuccessful) {
        // If refresh failed, redirect to login
        navigate('/login');
        return;
      }
    }

    try {
      const token = getAccessToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/user-data/${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // Token might have expired during the request
        const refreshSuccessful = await refreshTokenIfExpired();
        if (!refreshSuccessful) {
          navigate('/login');
          return;
        }
        
        // Retry the request with the new token
        const newAccessToken = getAccessToken();
        if (!newAccessToken) {
          navigate('/login');
          return;
        }
        
        const retryResponse = await fetch(`${process.env.REACT_APP_API_URL}/user-data/${currentUserId}`, {
          headers: {
            'Authorization': `Bearer ${newAccessToken}`
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error('Failed to fetch user data after token refresh');
        }
        
        const data = await retryResponse.json();
        
        // Check if user has volunteered data
        if (data.volunteeredData && data.volunteeredData.length > 0) {
          // User has volunteered data, navigate to profile
          navigate('/profile');
        } else {
          // User doesn't have volunteered data, navigate to data input
          navigate('/data-input');
        }
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      // Check if user has volunteered data
      if (data.volunteeredData && data.volunteeredData.length > 0) {
        // User has volunteered data, navigate to profile
        navigate('/profile');
      } else {
        // User doesn't have volunteered data, navigate to data input
        navigate('/data-input');
      }
    } catch (error) {
      console.error('Error checking user data:', error);
      // If there's an error, default to data input page
      navigate('/data-input');
    }
  }, [navigate, refreshTokenIfExpired]);

  useEffect(() => {
    // Check token validity on mount and update state
    const isValid = isTokenValid();
    const currentUserId = getUserId();
    setIsAuthenticated(isValid);
    setUserId(currentUserId);

    // If authenticated, check if token needs refresh
    if (isValid && currentUserId) {
      // Immediately try to refresh the token if needed
      refreshTokenIfExpired();
    }

    // Set up interval to check token validity more frequently (every 15 seconds)
    // This is especially important now that tokens expire after 1 minute
    const intervalId = setInterval(() => {
      // Always try to refresh if we have a valid token
      // This is more aggressive but ensures we don't get logged out unexpectedly
      if (isTokenValid()) {
        refreshTokenIfExpired();
      }
    }, 15000); // Check every 15 seconds instead of every minute

    return () => clearInterval(intervalId);
  }, [navigate, refreshTokenIfExpired]);

  return (
    <UserContext.Provider value={{ 
      userId, 
      isAuthenticated, 
      setUserId, 
      login, 
      logout, 
      refreshTokenIfExpired,
      checkUserDataAndNavigate
    }}>
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