import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useApiRequest } from '../hooks/useApiRequest';
import { NotificationProvider } from '../context/NotificationContext';
import * as TokenManager from '../utils/TokenManager';

// Mock the TokenManager functions
jest.mock('../utils/TokenManager', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  isTokenValid: jest.fn(),
  shouldRefresh: jest.fn()
}));

// Mock the fetch function
global.fetch = jest.fn();

// Mock the notification context
jest.mock('../context/NotificationContext', () => ({
  useNotificationContext: () => ({
    addNotification: jest.fn()
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('useApiRequest', () => {
  const mockFetch = global.fetch as jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
    
    // Default mock implementations
    (TokenManager.getAccessToken as jest.Mock).mockReturnValue('valid-token');
    (TokenManager.getRefreshToken as jest.Mock).mockReturnValue('valid-refresh-token');
    (TokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (TokenManager.shouldRefresh as jest.Mock).mockReturnValue(false);
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test data' }),
      status: 200,
      statusText: 'OK'
    });
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );
  
  it('should make a successful API request', async () => {
    const { result } = renderHook(() => useApiRequest(), { wrapper });
    
    await act(async () => {
      await result.current.request({
        url: '/test',
        method: 'GET'
      });
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toEqual({ data: 'test data' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-token'
        })
      })
    );
  });
  
  it('should handle API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    
    const { result } = renderHook(() => useApiRequest(), { wrapper });
    
    await act(async () => {
      try {
        await result.current.request({
          url: '/test',
          method: 'GET'
        });
      } catch (error) {
        // Expected error
      }
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('API error: 404 Not Found');
    expect(result.current.data).toBe(null);
  });
  
  it('should refresh token when needed', async () => {
    // Mock that token needs refreshing
    (TokenManager.shouldRefresh as jest.Mock).mockReturnValue(true);
    
    // Mock successful token refresh
    mockFetch.mockImplementation(async (url) => {
      if (url === 'http://localhost:3001/api/auth/refresh') {
        return {
          ok: true,
          json: async () => ({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          })
        };
      }
      
      return {
        ok: true,
        json: async () => ({ data: 'test data after refresh' })
      };
    });
    
    const { result } = renderHook(() => useApiRequest(), { wrapper });
    
    await act(async () => {
      await result.current.request({
        url: '/test',
        method: 'GET'
      });
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'valid-refresh-token' })
      })
    );
    
    expect(result.current.data).toEqual({ data: 'test data after refresh' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
  
  it('should handle unauthorized errors and retry after token refresh', async () => {
    // First call returns 401, second call succeeds
    mockFetch.mockImplementationOnce(async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    })).mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      })
    })).mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({ data: 'test data after retry' })
    }));
    
    const { result } = renderHook(() => useApiRequest(), { wrapper });
    
    await act(async () => {
      await result.current.request({
        url: '/test',
        method: 'GET'
      });
    });
    
    // Check that it made 3 fetch calls (original, refresh, retry)
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.current.data).toEqual({ data: 'test data after retry' });
  });
  
  it('should make requests without authentication when requiresAuth is false', async () => {
    const { result } = renderHook(() => useApiRequest(), { wrapper });
    
    await act(async () => {
      await result.current.request({
        url: '/public',
        method: 'GET',
        requiresAuth: false
      });
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/public',
      expect.objectContaining({
        method: 'GET',
        headers: expect.not.objectContaining({
          'Authorization': expect.anything()
        })
      })
    );
  });
  
  it('should include the request body for POST requests', async () => {
    const { result } = renderHook(() => useApiRequest(), { wrapper });
    const requestBody = { name: 'Test', email: 'test@example.com' };
    
    await act(async () => {
      await result.current.request({
        url: '/users',
        method: 'POST',
        body: requestBody
      });
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });
}); 