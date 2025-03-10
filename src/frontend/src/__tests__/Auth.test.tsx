// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '../context/UserContext';

// Test component that displays authentication state
function AuthStateDisplay() {
  const { isAuthenticated, userId, token, setUserId, setToken, setRefreshToken, logout } = useUser();
  
  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-id">{userId || 'No User ID'}</div>
      <div data-testid="token">{token ? 'Has Token' : 'No Token'}</div>
      <button 
        data-testid="login-button" 
        onClick={() => {
          setUserId('test-user');
          setToken('test-token');
          setRefreshToken('test-refresh-token');
        }}
      >
        Log In
      </button>
      <button 
        data-testid="logout-button" 
        onClick={logout}
      >
        Log Out
      </button>
    </div>
  );
}

describe('User Authentication Context', () => {
  it('starts with unauthenticated state', () => {
    render(
      <UserProvider>
        <AuthStateDisplay />
      </UserProvider>
    );

    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('No User ID');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
  });

  it('updates authentication state when tokens are set', () => {
    render(
      <UserProvider>
        <AuthStateDisplay />
      </UserProvider>
    );

    // Use the button to update the context
    fireEvent.click(screen.getByTestId('login-button'));

    // Check that the state was updated
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user');
    expect(screen.getByTestId('token')).toHaveTextContent('Has Token');
  });

  it('clears authentication state on logout', () => {
    render(
      <UserProvider initialUserId="test-user" initialToken="test-token">
        <AuthStateDisplay />
      </UserProvider>
    );

    // Verify we start authenticated
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    
    // Log out
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Check that the state was updated
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('No User ID');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
  });

  it('initializes with provided values', () => {
    render(
      <UserProvider 
        initialUserId="initial-user" 
        initialToken="initial-token"
        initialRefreshToken="initial-refresh-token"
      >
        <AuthStateDisplay />
      </UserProvider>
    );

    // Check that the state was initialized correctly
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('initial-user');
    expect(screen.getByTestId('token')).toHaveTextContent('Has Token');
  });
});
