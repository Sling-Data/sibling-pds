// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider, useUser } from '../context/UserContext';
import Profile from '../components/Profile';
import '@testing-library/jest-dom';

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
      <div>{userId || 'no-user'}</div>
      <button onClick={() => setUserId('test-123')}>Set User</button>
    </div>
  );
}

describe('UserContext', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('provides userId and setUserId', async () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByText('no-user')).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /set user/i }));
    });

    expect(screen.getByText('test-123')).toBeInTheDocument();
  });

  it('Profile component uses userId from context', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    render(
      <UserProvider>
        <TestComponent />
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </UserProvider>
    );

    // Initially shows no user message
    expect(screen.getByText('No user ID provided')).toBeInTheDocument();

    // Set user ID
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /set user/i }));
    });

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
      expect(screen.getByText(mockUserData.email)).toBeInTheDocument();
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/test-123`
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