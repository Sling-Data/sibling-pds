import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import SignupForm from '../components/SignupForm';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

describe('SignupForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockUserId = 'test-user-123';
  const originalError = console.error;

  beforeEach(() => {
    global.fetch = jest.fn();
    mockOnSuccess.mockClear();
    // Mock console.error to silence expected test errors
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Restore console.error
    console.error = originalError;
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(<SignupForm onSignupSuccess={mockOnSuccess} />);
    });
    expect(screen.getByText(/Create Your Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('displays validation errors for empty form submission', async () => {
    await act(async () => {
      render(<SignupForm onSignupSuccess={mockOnSuccess} />);
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText(/Create Account/i));
    });
    
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
  });

  it('displays validation error for invalid email', async () => {
    await act(async () => {
      render(<SignupForm onSignupSuccess={mockOnSuccess} />);
    });
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' }
      });
      
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'invalid-email' }
      });
      
      fireEvent.click(screen.getByText(/Create Account/i));
    });
    
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  });

  it('submits form successfully with valid data', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: mockUserId })
    });

    await act(async () => {
      render(<SignupForm onSignupSuccess={mockOnSuccess} />);
    });
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' }
      });
      
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.click(screen.getByText(/Create Account/i));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com'
        })
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUserId);
    });
  });

  it('handles submission error gracefully', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<SignupForm onSignupSuccess={mockOnSuccess} />);
    });
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Name/i), {
        target: { value: 'Test User' }
      });
      
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.click(screen.getByText(/Create Account/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to sign up/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
      expect(screen.queryByText(/Personal Information/i)).not.toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
}); 