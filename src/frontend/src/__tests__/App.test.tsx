import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../components/App';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('App Component', () => {
  const originalError = console.error;
  const originalLog = console.log;

  beforeEach(() => {
    mockFetch.mockClear();
    // Mock console methods to silence test output
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Restore console methods
    console.error = originalError;
    console.log = originalLog;
  });

  it('renders SignupForm by default', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText(/Create Your Account/i)).toBeInTheDocument();
    expect(screen.queryByText(/Personal Information/i)).not.toBeInTheDocument();
  });

  it('shows DataInput after successful signup', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ _id: 'test-user-123' }),
    });

    await act(async () => {
      render(<App />);
    });
    
    await act(async () => {
      // Fill in signup form
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' },
      });

      // Submit signup form
      fireEvent.click(screen.getByText(/Create Account/i));
    });

    // Wait for DataInput to appear
    await waitFor(() => {
      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
    });

    // Verify the API call
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
      }),
    });
  });

  it('persists user data between form submissions', async () => {
    // Mock successful signup
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ _id: 'test-user-123' }),
      })
      // Mock successful data submission
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      // Complete signup
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.click(screen.getByText(/Create Account/i));
    });

    // Wait for DataInput to appear
    await waitFor(() => {
      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
    });

    // Verify the signup API call
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
      }),
    });

    await act(async () => {
      // Fill in DataInput form
      fireEvent.change(screen.getByLabelText(/Location/i), {
        target: { value: 'New York' },
      });
      fireEvent.click(screen.getByText(/Sports/i));

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Primary Goal/i), {
        target: { value: 'fitness' },
      });
      fireEvent.change(screen.getByLabelText(/Profession/i), {
        target: { value: 'tech' },
      });
      fireEvent.click(screen.getByText(/Direct/i));
      fireEvent.click(screen.getByText(/Morning/i));
      fireEvent.change(screen.getByLabelText(/Fitness Level/i), {
        target: { value: 'beginner' },
      });
      fireEvent.click(screen.getByText(/Visual/i));
      fireEvent.change(screen.getByLabelText(/Age/i), {
        target: { value: '25' },
      });

      // Submit form
      fireEvent.click(screen.getByText(/Submit/i));
    });

    // Wait for the data submission API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith('http://localhost:3000/volunteered-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('test-user-123'),
      });
    });
  });
}); 

