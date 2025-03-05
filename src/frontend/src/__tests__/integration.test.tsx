// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider } from '../context/UserContext';
import { useFetch, clearCache } from '../hooks/useFetch';
import Profile from '../components/Profile';

// Mock the environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

interface User {
  name: string;
  email: string;
}

const mockInitialUser: User = {
  name: 'Test User',
  email: 'test@example.com',
};

const mockUpdatedUser: User = {
  name: 'Updated User',
  email: 'updated@example.com',
};

const mockNewUser: User = {
  name: 'New User',
  email: 'new@example.com',
};

// Simple test component that uses both UserContext and useFetch
function TestComponent({ userId }: { userId: string }) {
  const { data: user, error } = useFetch<User>(`${process.env.REACT_APP_API_URL}/users/${userId}`);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>Name: {user.name}</div>
      <div>Email: {user.email}</div>
    </div>
  );
}

describe('UserContext and useFetch Integration', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    clearCache();
  });

  afterEach(() => {
    jest.resetAllMocks();
    clearCache();
  });

  it('should fetch and display user data on initial render (cache miss)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInitialUser),
    });

    render(
      <UserProvider initialUserId="user123">
        <Profile />
      </UserProvider>
    );

    // Initial loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(mockInitialUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockInitialUser.email)).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/user123`
    );
  });

  it('should retry on 500 error and eventually succeed', async () => {
    // Mock 500 errors for first two attempts, then succeed
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInitialUser),
      });

    render(
      <UserProvider initialUserId="user123">
        <Profile />
      </UserProvider>
    );

    // Wait for retries and final success
    await waitFor(
      () => {
        expect(screen.getByText(mockInitialUser.name)).toBeInTheDocument();
      },
      { timeout: 1000 } // Allow time for retries
    );

    // Verify three attempts were made
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should use cached data and then refetch after update', async () => {
    // First request - will be cached
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInitialUser),
    });

    render(
      <UserProvider initialUserId="user123">
        <Profile />
      </UserProvider>
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText(mockInitialUser.name)).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    // Update form fields
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: mockUpdatedUser.name },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: mockUpdatedUser.email },
    });

    // Mock PUT request success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Mock subsequent GET request with updated data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUpdatedUser),
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    // Verify updated data is displayed
    await waitFor(() => {
      expect(screen.getByText(mockUpdatedUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUpdatedUser.email)).toBeInTheDocument();
    });

    // Verify both PUT and GET requests were made
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial GET + PUT + Refetch GET
    expect(mockFetch.mock.calls[1][0]).toBe(`${process.env.REACT_APP_API_URL}/users/user123`);
    expect(mockFetch.mock.calls[1][1]).toEqual({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockUpdatedUser),
    });
  });

  it('should handle network errors with retry', async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInitialUser),
      });

    render(
      <UserProvider initialUserId="user123">
        <Profile />
      </UserProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByText(mockInitialUser.name)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should render error state on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <UserProvider>
        <TestComponent userId="user123" />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
    });
  });

  it('should update display when user ID changes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInitialUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNewUser),
      });

    const { rerender } = render(
      <UserProvider>
        <TestComponent userId="user123" />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockInitialUser.name}`)).toBeInTheDocument();
    });

    // Rerender with new user ID
    rerender(
      <UserProvider>
        <TestComponent userId="user456" />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockNewUser.name}`)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(`${process.env.REACT_APP_API_URL}/users/user123`);
    expect(mockFetch.mock.calls[1][0]).toBe(`${process.env.REACT_APP_API_URL}/users/user456`);
  });
}); 