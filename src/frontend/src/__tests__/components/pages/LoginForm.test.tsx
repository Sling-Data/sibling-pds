// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { LoginForm } from '../../../components/pages/LoginForm';

// Mock the useAuth hook
const mockLogin = jest.fn();
const mockCheckUserDataAndNavigate = jest.fn();
const mockNavigate = jest.fn();

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: false,
    isInitialized: true,
    userId: null
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    checkUserDataAndNavigate: mockCheckUserDataAndNavigate
  })
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MemoryRouter><LoginForm /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /log in to your account/i })).toBeInTheDocument();
  });

  it('successful login redirects to profile', async () => {
    mockLogin.mockResolvedValueOnce({
      data: {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'test-user'
      },
      success: true,
      error: null
    });

    render(<MemoryRouter initialEntries={['/login']}><LoginForm /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    // Verify checkUserDataAndNavigate is called instead of direct navigation
    expect(mockCheckUserDataAndNavigate).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<MemoryRouter initialEntries={['/login']}><LoginForm /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback when provided', async () => {
    const mockOnSuccess = jest.fn();
    mockLogin.mockResolvedValueOnce({
      data: {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: 'test-user'
      },
      success: true,
      error: null
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginForm onSuccess={mockOnSuccess} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    // Should not navigate when onSuccess is provided
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
