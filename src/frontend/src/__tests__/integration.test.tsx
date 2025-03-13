import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider } from '../context/UserContext';
import { useFetch, clearCache } from '../hooks/useFetch';

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

// Simple test component that uses both UserContext and useFetch
function TestComponent({ userId, onRefetch }: { userId: string; onRefetch?: (refetch: () => Promise<void>) => void }) {
  const { data: user, error, refetch } = useFetch<User>(`${process.env.REACT_APP_API_URL}/users/${userId}`);

  if (onRefetch && refetch) {
    onRefetch(refetch);
  }

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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    clearCache();
    jest.useRealTimers();
  });

  it('should fetch and display user data on initial render (cache miss)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInitialUser),
    });

    render(
      <UserProvider>
        <TestComponent userId="user123" />
      </UserProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Should display user data after fetch
    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockInitialUser.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Email: ${mockInitialUser.email}`)).toBeInTheDocument();
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/users/user123`, {"headers": {}, "method": "GET"});
  });

  it('should retry on 500 error and eventually succeed', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInitialUser),
      });

    render(
      <UserProvider>
        <TestComponent userId="user123" />
      </UserProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Should display user data after successful retry
    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockInitialUser.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Email: ${mockInitialUser.email}`)).toBeInTheDocument();
    });

    // Verify fetch was called multiple times due to retries
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/users/user123`, {"headers": {}, "method": "GET"});
  });

  it('should use cached data and then refetch after update', async () => {
    let refetchFn: () => Promise<void>;

    // First fetch - store in cache
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInitialUser),
    });

    // Second fetch - updated data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUpdatedUser),
    });

    // Initial render
    render(
      <UserProvider>
        <TestComponent 
          userId="user123" 
          onRefetch={(refetch) => {
            refetchFn = refetch;
          }} 
        />
      </UserProvider>
    );

    // Wait for initial data to be displayed
    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockInitialUser.name}`)).toBeInTheDocument();
    });

    // Trigger a refetch
    await act(async () => {
      await refetchFn();
    });

    // Should update with new data after refetch
    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockUpdatedUser.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Email: ${mockUpdatedUser.email}`)).toBeInTheDocument();
    });

    // Verify fetch was called twice
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/users/user123`, {"headers": {}, "method": "GET"});
  });

  it('should handle network errors with retry', async () => {
    // First attempt - network error
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'));
    
    // Second attempt - network error
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'));
    
    // Third attempt - success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockInitialUser),
    });

    render(
      <UserProvider>
        <TestComponent userId="user123" />
      </UserProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for retry delays
    await act(async () => {
      // First retry delay (100ms)
      jest.advanceTimersByTime(100);
      // Second retry delay (200ms)
      jest.advanceTimersByTime(200);
      // Instead of running all timers which can cause infinite loop,
      // just advance by a reasonable amount of time
      jest.advanceTimersByTime(1000);
    });

    // Should display user data after successful retry
    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockInitialUser.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Email: ${mockInitialUser.email}`)).toBeInTheDocument();
    });

    // Verify fetch was called multiple times due to retries
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/users/user123`, {"headers": {}, "method": "GET"});
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
        json: () => Promise.resolve(mockUpdatedUser),
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
      expect(screen.getByText(`Name: ${mockUpdatedUser.name}`)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(`${process.env.REACT_APP_API_URL}/users/user123`);
    expect(mockFetch.mock.calls[1][0]).toBe(`${process.env.REACT_APP_API_URL}/users/user456`);
  });
});