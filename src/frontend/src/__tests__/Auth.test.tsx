// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '../context/UserContext';
import { TokenManager } from '../utils/TokenManager';

// Mock TokenManager
jest.mock('../utils/TokenManager', () => ({
  TokenManager: {
    getUserId: jest.fn(),
    isTokenValid: jest.fn(),
    storeTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

// Test component that uses the UserContext
const TestComponent = () => {
  const { userId, isAuthenticated, login, logout } = useUser();
  return (
    <div>
      <div data-testid="user-id">{userId || 'no-user'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <button onClick={() => login('test-access', 'test-refresh')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('User Authentication Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TokenManager.getUserId as jest.Mock).mockReturnValue(null);
    (TokenManager.isTokenValid as jest.Mock).mockReturnValue(false);
  });

  it('starts with unauthenticated state', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  it('updates authentication state when tokens are set', () => {
    // Mock token storage response
    (TokenManager.storeTokens as jest.Mock).mockImplementation(() => {});
    (TokenManager.getUserId as jest.Mock)
      .mockReturnValue('test-user-123');
    (TokenManager.isTokenValid as jest.Mock)
      .mockReturnValue(true);

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Click login button
    act(() => {
      screen.getByText('Login').click();
    });

    // Verify state updates
    expect(TokenManager.storeTokens).toHaveBeenCalledWith({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
    });
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-123');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
  });

  it('clears authentication state on logout', () => {
    // Mock initial authenticated state
    (TokenManager.getUserId as jest.Mock).mockReturnValue('test-user-123');
    (TokenManager.isTokenValid as jest.Mock).mockReturnValue(true);

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Verify initial state
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-123');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

    // Mock state after logout
    (TokenManager.getUserId as jest.Mock).mockReturnValue(null);
    (TokenManager.isTokenValid as jest.Mock).mockReturnValue(false);

    // Click logout button
    act(() => {
      screen.getByText('Logout').click();
    });

    // Verify state is cleared
    expect(TokenManager.clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  it('initializes with provided values', () => {
    // Mock initial state with existing user
    (TokenManager.getUserId as jest.Mock).mockReturnValue('existing-user-123');
    (TokenManager.isTokenValid as jest.Mock).mockReturnValue(true);

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Verify state is initialized from TokenManager
    expect(screen.getByTestId('user-id')).toHaveTextContent('existing-user-123');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
  });
});
