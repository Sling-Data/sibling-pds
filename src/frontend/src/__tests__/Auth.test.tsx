// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '../contexts/UserContextOld';
import * as tokenUtils from '../utils/TokenManager';

// Mock TokenManager functions
jest.mock('../utils/TokenManager', () => ({
  getUserId: jest.fn(),
  isTokenValid: jest.fn(),
  storeTokens: jest.fn(),
  clearTokens: jest.fn(),
  getRefreshToken: jest.fn(),
  shouldRefresh: jest.fn(),
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
    (tokenUtils.getUserId as jest.Mock).mockReturnValue(null);
    (tokenUtils.isTokenValid as jest.Mock).mockReturnValue(false);
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
    (tokenUtils.storeTokens as jest.Mock).mockImplementation(() => {});
    (tokenUtils.getUserId as jest.Mock)
      .mockReturnValue('test-user-123');
    (tokenUtils.isTokenValid as jest.Mock)
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
    expect(tokenUtils.storeTokens).toHaveBeenCalledWith({
      token: 'test-access',
      refreshToken: 'test-refresh',
    });
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-123');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
  });

  it('clears authentication state on logout', () => {
    // Mock initial authenticated state
    (tokenUtils.getUserId as jest.Mock).mockReturnValue('test-user-123');
    (tokenUtils.isTokenValid as jest.Mock).mockReturnValue(true);

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Verify initial state
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-123');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

    // Mock state after logout
    (tokenUtils.getUserId as jest.Mock).mockReturnValue(null);
    (tokenUtils.isTokenValid as jest.Mock).mockReturnValue(false);

    // Click logout button
    act(() => {
      screen.getByText('Logout').click();
    });

    // Verify state is cleared
    expect(tokenUtils.clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  it('initializes with provided values', () => {
    // Mock initial state with existing user
    (tokenUtils.getUserId as jest.Mock).mockReturnValue('existing-user-123');
    (tokenUtils.isTokenValid as jest.Mock).mockReturnValue(true);

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
