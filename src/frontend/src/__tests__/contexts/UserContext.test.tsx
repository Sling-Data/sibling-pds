import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { UserProvider, useUserContext } from '../../contexts/UserContext';

describe('UserContextNew', () => {
  // Test component that uses the context
  const TestComponent = () => {
    const { userId, user, loading, error, hasCompletedOnboarding, setUserId } = useUserContext();
    
    return (
      <div>
        <div data-testid="userId">{userId || 'no-user-id'}</div>
        <div data-testid="userName">{user?.name || 'no-user'}</div>
        <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
        <div data-testid="error">{error || 'no-error'}</div>
        <div data-testid="onboarding">
          {hasCompletedOnboarding ? 'completed' : 'not-completed'}
        </div>
        <button onClick={() => setUserId('test-user-id')}>Set User ID</button>
      </div>
    );
  };

  test('provides initial state', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByTestId('userId')).toHaveTextContent('no-user-id');
    expect(screen.getByTestId('userName')).toHaveTextContent('no-user');
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('not-completed');
  });

  test('setUserId updates userId in the context', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    
    const { result } = renderHook(() => useUserContext(), { wrapper });
    
    act(() => {
      result.current.setUserId('test-user-id');
    });
    
    expect(result.current.userId).toBe('test-user-id');
  });

  test('setUser updates user in the context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    
    const { result } = renderHook(() => useUserContext(), { wrapper });
    
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com'
    };
    
    act(() => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
  });

  test('setLoading updates loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    
    const { result } = renderHook(() => useUserContext(), { wrapper });
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.loading).toBe(true);
  });

  test('setError updates error state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    
    const { result } = renderHook(() => useUserContext(), { wrapper });
    
    act(() => {
      result.current.setError('Test error message');
    });
    
    expect(result.current.error).toBe('Test error message');
  });

  test('setHasCompletedOnboarding updates onboarding state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    
    const { result } = renderHook(() => useUserContext(), { wrapper });
    
    act(() => {
      result.current.setHasCompletedOnboarding(true);
    });
    
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });

  test('updateUserState updates multiple state properties at once', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    
    const { result } = renderHook(() => useUserContext(), { wrapper });
    
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com'
    };
    
    act(() => {
      result.current.updateUserState({
        user: mockUser,
        userId: 'user-123',
        loading: true,
        error: null,
        hasCompletedOnboarding: true
      });
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userId).toBe('user-123');
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });

  test('resetUserState resets state to initial values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    
    const { result } = renderHook(() => useUserContext(), { wrapper });
    
    // First set some values
    act(() => {
      result.current.updateUserState({
        userId: 'user-123',
        loading: true,
        error: 'Some error',
        hasCompletedOnboarding: true
      });
    });
    
    // Then reset
    act(() => {
      result.current.resetUserState();
    });
    
    // Verify reset to initial state
    expect(result.current.user).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });

  test('throws error when used outside of provider', () => {
    // Suppress console error in test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => renderHook(() => useUserContext())).toThrow(
      'useUserContext must be used within a UserProvider'
    );
    
    // Restore console.error
    console.error = originalError;
  });
}); 