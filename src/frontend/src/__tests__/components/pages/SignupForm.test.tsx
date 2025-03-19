import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { BrowserRouter } from 'react-router-dom';
import { SignupForm } from '../../../components/pages/SignupForm';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock TokenManager
jest.mock('../../../utils/TokenManager', () => ({
  storeTokens: jest.fn(),
  clearTokens: jest.fn(),
  getUserId: jest.fn(),
  isTokenValid: jest.fn(),
  getAccessToken: jest.fn().mockReturnValue('mock-token'),
  getRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  shouldRefresh: jest.fn().mockReturnValue(false),
}));

// Mock useAuth hook
const mockSignup = jest.fn();
const mockCheckUserDataAndNavigate = jest.fn();

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    signup: mockSignup,
    checkUserDataAndNavigate: mockCheckUserDataAndNavigate,
    isAuthenticated: true,
    userId: 'test-user-123'
  }),
}));

// Mock useUser hook to handle the case when it's accessed outside UserProviderNew
jest.mock('../../../hooks/useUser', () => ({
  useUser: () => {
    // This will be caught by the try/catch in SignupForm
    throw new Error('useUserContextNew must be used within a UserProviderNew');
  }
}));

const mockUserId = 'test-user-123';

// Helper function to render with all required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SignupForm Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSignup.mockClear();
    mockCheckUserDataAndNavigate.mockClear();
    
    // Setup default behavior for mockSignup
    mockSignup.mockResolvedValue({
      data: {
        userId: mockUserId,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      },
      error: null
    });
    
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<SignupForm />);
    
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    renderWithProviders(<SignupForm />);
    
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
    renderWithProviders(<SignupForm />);
    
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
    renderWithProviders(<SignupForm />);
    
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
    renderWithProviders(<SignupForm />);

    // Fill in form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Setup fake timers
    jest.useFakeTimers();
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Verify API call was made
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });
      
    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });
    
    // Now check that the function was called
    expect(mockCheckUserDataAndNavigate).toHaveBeenCalled();
    
    // Restore real timers
    jest.useRealTimers();
  });

  it('handles submission errors gracefully', async () => {
    // Setup mock to return an error
    mockSignup.mockResolvedValueOnce({
      data: null,
      error: 'Email already exists'
    });

    renderWithProviders(<SignupForm />);

    // Fill in form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      expect(mockCheckUserDataAndNavigate).not.toHaveBeenCalled();
    });
  });
});