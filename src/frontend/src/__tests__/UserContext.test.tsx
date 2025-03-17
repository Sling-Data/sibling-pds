// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider, useUser } from '../context/UserContext';
import Profile from '../components/pages/Profile';
import '@testing-library/jest-dom';
import * as tokenUtils from '../utils/TokenManager';

// Mock TokenManager functions
jest.mock('../utils/TokenManager', () => ({
  getUserId: jest.fn().mockReturnValue(null),
  isTokenValid: jest.fn().mockReturnValue(false),
  storeTokens: jest.fn(),
  clearTokens: jest.fn(),
  getRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  shouldRefresh: jest.fn().mockReturnValue(false),
  getAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  getTokenExpiry: jest.fn().mockReturnValue(Date.now() / 1000 + 3600)
}));

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

const mockUserData = {
  name: 'Test User',
  email: 'test@example.com'
};

// Test component that uses the context
function TestComponent() {
  const { userId, setUserId } = useUser();
  return (
    <div>
      <div data-testid="user-id-display">{userId || 'no-user'}</div>
      <button data-testid="set-user-button" onClick={() => setUserId('test-123')}>Set User</button>
    </div>
  );
}

describe('UserContext', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('provides userId and setUserId', async () => {
    // Set up initial state
    (tokenUtils.getUserId as jest.Mock).mockReturnValue(null);
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByText('no-user')).toBeInTheDocument();
    
    // Mock the getUserId to return the new ID after setUserId is called
    (tokenUtils.getUserId as jest.Mock).mockReturnValue('test-123');
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('set-user-button'));
    });

    // Mock the refreshTokenIfExpired call to prevent infinite loop
    jest.spyOn(global, 'setInterval').mockImplementation(() => {
      return {} as any;
    });

    await waitFor(() => {
      const userIdElement = screen.getByTestId('user-id-display');
      expect(userIdElement.textContent).toBe('test-123');
    });
  });

  it('Profile component uses userId from context', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    // Mock setInterval to prevent infinite loop
    jest.spyOn(global, 'setInterval').mockImplementation(() => {
      return {} as any;
    });
    
    // Set up initial state - no user ID
    (tokenUtils.getUserId as jest.Mock).mockReturnValue(null);

    render(
      <UserProvider>
        <TestComponent />
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </UserProvider>
    );

    // Initially shows no user message
    const profileElement = screen.getByText(/no user id provided/i);
    expect(profileElement).toBeInTheDocument();

    // Set user ID and update the mock
    (tokenUtils.getUserId as jest.Mock).mockReturnValue('test-123');
    
    // Set user ID
    await act(async () => {
      fireEvent.click(screen.getByTestId('set-user-button'));
    });

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
      expect(screen.getByText(mockUserData.email)).toBeInTheDocument();
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/test-123`,
      { headers: {}, method: "GET" }
    );
  });

  it('throws error when useUser is used outside of UserProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useUser must be used within a UserProvider');

    consoleSpy.mockRestore();
  });
}); 