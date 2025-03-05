import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import SignupForm from '../components/SignupForm';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

const mockUserId = 'test-user-123';
const mockOnSuccess = jest.fn();

describe('SignupForm Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockOnSuccess.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders without crashing', () => {
    render(<SignupForm onSuccess={mockOnSuccess} />);
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    render(<SignupForm onSuccess={mockOnSuccess} />);
    
    await act(async () => {
      fireEvent.click(screen.getByText('Create Account'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<SignupForm onSuccess={mockOnSuccess} />);
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'invalid-email' },
      });
      
      fireEvent.click(screen.getByText('Create Account'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ _id: mockUserId }),
    });

    render(<SignupForm onSuccess={mockOnSuccess} />);
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      
      fireEvent.click(screen.getByText('Create Account'));
    });
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUserId);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/users',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
        }),
      })
    );
  });

  it('handles submission errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    render(<SignupForm onSuccess={mockOnSuccess} />);
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      
      fireEvent.click(screen.getByText('Create Account'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to sign up')).toBeInTheDocument();
    });
    
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
}); 