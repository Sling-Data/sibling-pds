import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '../context/UserContext';
import Profile from '../components/Profile';
import { useEffect } from 'react';

// Mock the environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

const mockUserId = '123';
const mockUserData = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com'
};

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

function TestComponent({ onContextReady }: { onContextReady: (context: { setUserId: (id: string | null) => void }) => void }) {
  const context = useUser();
  
  useEffect(() => {
    onContextReady(context);
  }, [onContextReady]);

  return <Profile />;
}

describe('useFetch and UserContext Integration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state while fetching data', async () => {
    // Mock fetch to delay response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({
            ok: true,
            json: () => Promise.resolve(mockUserData)
          }), 100)
      )
    );

    render(
      <UserProvider initialUserId={mockUserId}>
        <Profile />
      </UserProvider>
    );

    // Should show loading state initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
    });
  });

  it('renders user data after successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUserData)
    });

    render(
      <UserProvider initialUserId={mockUserId}>
        <Profile />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
      expect(screen.getByText(mockUserData.email)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/${mockUserId}`
    );
  });

  it('renders error state on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <UserProvider initialUserId={mockUserId}>
        <Profile />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('handles missing user ID gracefully', () => {
    render(
      <UserProvider>
        <Profile />
      </UserProvider>
    );

    expect(screen.getByText(/no user id provided/i)).toBeInTheDocument();
  });

  it('updates display when user ID changes', async () => {
    const newMockUserId = '456';
    const newMockUserData = {
      id: '456',
      name: 'Test User',
      email: 'test@example.com'
    };

    // Mock the first fetch for the initial user
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockUserData)
    }));

    let setUserIdFromContext: ((id: string | null) => void) | null = null;

    render(
      <UserProvider initialUserId={mockUserId}>
        <TestComponent onContextReady={(context) => {
          setUserIdFromContext = context.setUserId;
        }} />
      </UserProvider>
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
    });

    // Mock the second fetch for the new user
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(newMockUserData)
    }));

    // Update the user ID using the context
    await act(async () => {
      if (setUserIdFromContext) {
        setUserIdFromContext(newMockUserId);
      }
    });

    // Wait for new data
    await waitFor(() => {
      expect(screen.getByText(newMockUserData.name)).toBeInTheDocument();
      expect(screen.getByText(newMockUserData.email)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      `${process.env.REACT_APP_API_URL}/users/${newMockUserId}`
    );
  });
}); 