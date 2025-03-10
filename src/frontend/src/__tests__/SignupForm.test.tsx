// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import SignupForm from '../components/SignupForm';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from '../context/UserContext';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockUserId = 'test-user-123';
const mockOnSuccess = jest.fn();

// Helper function to render SignupForm with context and router
const renderSignupForm = () => {
  return render(
    <BrowserRouter>
      <UserProvider>
        <SignupForm onSuccess={mockOnSuccess} />
      </UserProvider>
    </BrowserRouter>
  );
};

describe('SignupForm Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockOnSuccess.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders without crashing', () => {
    renderSignupForm();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    renderSignupForm();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('form'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderSignupForm();
    
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderSignupForm();
    
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'short' },
    });
    
    fireEvent.click(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data', async () => {
    // Mock user creation response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ _id: mockUserId }),
    });
    
    // Mock auth signup response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      }),
    });

    renderSignupForm();
    
    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      
      fireEvent.click(screen.getByRole('form'));
    });
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUserId);
    });

    // Check first fetch call (user creation)
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
    
    // Check second fetch call (auth signup)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/auth/signup',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUserId,
          password: 'password123',
        }),
      })
    );
  });

  it('handles submission errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    renderSignupForm();
    
    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      
      fireEvent.click(screen.getByRole('form'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to sign up')).toBeInTheDocument();
    });
  });
});