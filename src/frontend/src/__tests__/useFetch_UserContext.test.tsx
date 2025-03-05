import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider } from '../context/UserContext';
import Profile from '../components/Profile';
import { useFetch, cache } from '../hooks/useFetch';

// Mock the environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

interface User {
  _id: string;
  name: string;
  email: string;
}

const mockUser: User = {
  _id: '123',
  name: 'Test User',
  email: 'test@example.com',
};

const mockNewUser: User = {
  _id: '456',
  name: 'New User',
  email: 'new@example.com',
};

// Test component that uses both UserContext and useFetch
function TestComponent({ userId }: { userId: string }) {
  const { data: user, error } = useFetch<User>(`http://localhost:3000/users/${userId}`);

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

describe('useFetch and UserContext Integration', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    cache.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
    cache.clear();
  });

  it('renders user data after successful fetch', async () => {
    const mockUserId = '123';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    render(
      <UserProvider initialUserId={mockUserId}>
        <Profile />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/${mockUserId}`
    );
  });

  it('renders error state on fetch failure', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Failed to fetch')));

    render(
      <UserProvider>
        <TestComponent userId={mockUser._id} />
      </UserProvider>
    );

    await waitFor(() => {
      const errorElement = screen.getByText('Error: Failed to fetch');
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('updates display when user ID changes', async () => {
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNewUser),
      }));

    const { rerender } = render(
      <UserProvider>
        <TestComponent userId={mockUser._id} />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockUser.name}`)).toBeInTheDocument();
    });

    // Rerender with new user ID
    rerender(
      <UserProvider>
        <TestComponent userId={mockNewUser._id} />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(`Name: ${mockNewUser.name}`)).toBeInTheDocument();
    });
  });
}); 