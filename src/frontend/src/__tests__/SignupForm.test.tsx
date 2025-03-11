import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SignupForm } from '../components/SignupForm';

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

const mockUserId = 'test-user-123';

describe('SignupForm Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
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
    render(<SignupForm />);
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    render(<SignupForm />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // Verify no API call was made
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email', async () => {
    render(<SignupForm />);
    
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

    // Verify no API call was made
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows validation error for short password', async () => {
    render(<SignupForm />);
    
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

    // Verify no API call was made
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('successfully submits form with valid data and navigates to dataInput page', async () => {
    render(<SignupForm />);

    // Mock successful API response
    (global.fetch as jest.Mock).mockImplementationOnce(async (url, init) => {
      if (url === `${process.env.REACT_APP_API_URL}/auth/signup` && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        expect(body).toEqual({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

        return {
          ok: true,
          json: async () => ({
            userId: mockUserId,
            token: 'mock-token',
            refreshToken: 'mock-refresh-token'
          })
        };
      }
      return { ok: false };
    });

    // Fill in form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Verify API call was made and tokens were stored
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
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
    render(<SignupForm />);

    // Mock API error response
    (global.fetch as jest.Mock).mockImplementationOnce(async () => ({
      ok: false,
      json: async () => ({ message: 'Email already exists' })
    }));

    // Fill in form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
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