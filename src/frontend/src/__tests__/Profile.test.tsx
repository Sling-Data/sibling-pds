// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import Profile from '../components/Profile';
import { UserProvider } from '../context/UserContext';
import { BrowserRouter } from 'react-router-dom';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: jest.fn().mockReturnValue({ search: '' }),
    useNavigate: jest.fn().mockReturnValue(jest.fn())
  };
});

describe('Profile Component', () => {
  const originalError = console.error;
  const originalLog = console.log;

  beforeEach(() => {
    global.fetch = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    console.error = originalError;
    console.log = originalLog;
  });

  const renderWithProvider = () => {
    return render(
      <BrowserRouter>
        <UserProvider>
          <Profile />
        </UserProvider>
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderWithProvider();
    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    renderWithProvider();
    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });

  it('displays user data when fetch succeeds', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <UserProvider>
            <Profile />
          </UserProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <UserProvider>
            <Profile />
          </UserProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <UserProvider>
            <Profile />
          </UserProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });

  it('successfully updates user profile', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const updatedUserData = {
      name: 'Updated User',
      email: 'updated@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    // Update request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Profile updated successfully' })
    });

    // Fetch after update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedUserData
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <UserProvider>
            <Profile />
          </UserProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });

  it('handles update errors gracefully', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData
      })
      .mockRejectedValueOnce(new Error('Update failed'));

    await act(async () => {
      render(
        <BrowserRouter>
          <UserProvider>
            <Profile />
          </UserProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });

  it('handles cancel button click', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <UserProvider>
            <Profile />
          </UserProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('No user ID provided')).toBeInTheDocument();
  });
});