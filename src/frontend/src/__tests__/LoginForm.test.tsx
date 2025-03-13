// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { LoginForm } from '../components/LoginForm';

// Mock the UserContext hook
const mockCheckUserDataAndNavigate = jest.fn();
jest.mock('../context/UserContext', () => ({
  useUser: () => ({
    login: jest.fn(),
    setUserId: jest.fn(),
    checkUserDataAndNavigate: mockCheckUserDataAndNavigate
  })
}));

// Mock the useFetch hook
const mockUpdate = jest.fn();
jest.mock('../hooks/useFetch', () => ({
  useFetch: () => ({
    loading: false,
    error: null,
    update: mockUpdate
  })
}));

describe('LoginForm Component', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><LoginForm /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /log in to your account/i })).toBeInTheDocument();
  });

  it('successful login redirects to profile', async () => {
    render(<MemoryRouter initialEntries={['/login']}><LoginForm /></MemoryRouter>);

    mockUpdate.mockImplementation(async () => ({
      data: { token: 'mock-token', refreshToken: 'mock-refresh-token' },
      error: null
    }));

    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'test-user' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: { userId: 'test-user', password: 'password123' }
        })
      );
    });

    // Assuming successful login redirects to /profile
    expect(mockCheckUserDataAndNavigate).toHaveBeenCalled();
  });

  it('displays error message on failed login', async () => {
    mockUpdate.mockImplementation(async () => ({
      data: null,
      error: 'Invalid credentials'
    }));

    render(<MemoryRouter initialEntries={['/login']}><LoginForm /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'wrong-user' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
