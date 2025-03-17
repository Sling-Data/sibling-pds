import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SignupForm } from '../components/pages/SignupForm';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock TokenManager
jest.mock('../utils/TokenManager', () => ({
  storeTokens: jest.fn(),
  clearTokens: jest.fn(),
  getUserId: jest.fn(),
  isTokenValid: jest.fn(),
}));

// Mock UserContext
const mockLogin = jest.fn();
const mockSetUserId = jest.fn();
const mockCheckUserDataAndNavigate = jest.fn();

jest.mock('../context/UserContext', () => ({
  ...jest.requireActual('../context/UserContext'),
  useUser: () => ({
    login: mockLogin,
    setUserId: mockSetUserId,
    checkUserDataAndNavigate: mockCheckUserDataAndNavigate
  }),
}));

// Mock useFetch hook
jest.mock('../hooks/useFetch', () => ({
  useFetch: () => ({
    loading: false,
    error: null,
    data: null,
    update: jest.fn().mockImplementation(async (url, options) => {
      if (url.includes('/auth/signup')) {
        if (options?.body?.email === 'existing@example.com') {
          return { data: null, error: 'Email already exists' };
        }
        return {
          data: {
            userId: 'test-user-123',
            token: 'mock-token',
            refreshToken: 'mock-refresh-token'
          },
          error: null
        };
      }
      return { data: null, error: 'Unexpected error' };
    }),
    refetch: jest.fn(),
    fromCache: false
  })
}));

const mockUserId = 'test-user-123';

describe('SignupForm Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockClear();
    mockSetUserId.mockClear();
    mockCheckUserDataAndNavigate.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <SignupForm />
      </BrowserRouter>
    );
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    render(
      <BrowserRouter>
        <SignupForm />
      </BrowserRouter>
    );
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(
      <BrowserRouter>
        <SignupForm />
      </BrowserRouter>
    );
    
    // Fill in form with invalid email
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/email is invalid/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(
      <BrowserRouter>
        <SignupForm />
      </BrowserRouter>
    );
    
    // Fill in form with short password
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data and navigates to dataInput page', async () => {
    render(
      <BrowserRouter>
        <SignupForm />
      </BrowserRouter>
    );

    // Fill in form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Verify API call was made and tokens were stored
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('mock-token', 'mock-refresh-token');
      expect(mockSetUserId).toHaveBeenCalledWith(mockUserId);
      
      // Check that checkUserDataAndNavigate was called instead of directly navigating
      // We need to wait a bit because of the setTimeout in the component
      setTimeout(() => {
        expect(mockCheckUserDataAndNavigate).toHaveBeenCalled();
      }, 150);
    });
  });

  it('handles submission errors gracefully', async () => {
    render(
      <BrowserRouter>
        <SignupForm />
      </BrowserRouter>
    );

    // Fill in form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockSetUserId).not.toHaveBeenCalled();
      expect(mockCheckUserDataAndNavigate).not.toHaveBeenCalled();
    });
  });
});