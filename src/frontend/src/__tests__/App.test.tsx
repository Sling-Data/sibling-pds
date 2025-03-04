import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
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
      json: async () => ({ _id: 'test-user-123' })
    });

    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      // Fill in signup form
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    });

    // Wait for DataInput to appear
    await waitFor(() => {
      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
    });

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com'
      })
    });
  });

  it('shows Profile after successful data submission', async () => {
    // Mock successful signup
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: 'test-user-123' })
    });

    // Mock successful data submission
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Mock successful profile fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: 'Test User',
        email: 'test@example.com'
      })
    });

    await act(async () => {
      render(<App />);
    });

    // Fill and submit signup form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    });

    // Fill and submit data input form
    await act(async () => {
      // Fill required fields
      fireEvent.click(screen.getByLabelText('Sports'));
      fireEvent.change(screen.getByRole('combobox', { name: /primary goal/i }), {
        target: { value: 'fitness' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your location'), {
        target: { value: 'New York' }
      });
      fireEvent.change(screen.getByRole('combobox', { name: /profession/i }), {
        target: { value: 'tech' }
      });
      fireEvent.click(screen.getByRole('radio', { name: 'Direct' }));
      fireEvent.click(screen.getByLabelText('Morning'));
      fireEvent.change(screen.getByRole('combobox', { name: /fitness level/i }), {
        target: { value: 'beginner' }
      });
      fireEvent.click(screen.getByLabelText('Visual'));
      fireEvent.change(screen.getByPlaceholderText('Enter your age'), {
        target: { value: '25' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Wait for Profile to appear
    await waitFor(() => {
      expect(screen.getByText('User Profile')).toBeInTheDocument();
    });

    // Verify all API calls were made in the correct order
    expect(mockFetch).toHaveBeenNthCalledWith(1, `${process.env.REACT_APP_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com'
      })
    });

    expect(mockFetch).toHaveBeenNthCalledWith(2, `${process.env.REACT_APP_API_URL}/volunteered-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining('test-user-123')
    });

    expect(mockFetch).toHaveBeenNthCalledWith(3, `${process.env.REACT_APP_API_URL}/users/test-user-123`);
  });
}); 

