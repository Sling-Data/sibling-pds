// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../components/App';

// Mock the environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Mock jwt-decode to always return a valid token payload
jest.mock('jwt-decode', () => ({
  jwtDecode: () => ({
    userId: 'test-user-123',
    exp: Math.floor(Date.now() / 1000) + 3600, // Token expires in 1 hour
    iat: Math.floor(Date.now() / 1000)
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.location to handle navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('App Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockNavigate.mockClear();
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to login when not authenticated', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /log in to your account/i })).toBeInTheDocument();
    });
  });

  it('redirects to profile when authenticated', async () => {
    // Set up authenticated state in session storage
    sessionStorage.setItem('userId', 'test-user-123');
    sessionStorage.setItem('accessToken', 'mock-token');
    sessionStorage.setItem('refreshToken', 'mock-refresh-token');

    // Mock user data fetch for Profile component
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test User', email: 'test@example.com' }),
    });

    render(<App />);
    
    // When authenticated, we should be redirected to profile
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /log in to your account/i })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /user profile/i })).toBeInTheDocument();
    });
  });

  it('redirects to data-input after successful signup', async () => {
    // Start at the signup page
    window.history.pushState({}, '', '/signup');
    render(<App />);

    // Wait for signup form to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    });

    // Mock signup response and verify request payload
    (global.fetch as jest.Mock).mockImplementationOnce(async (url, init) => {
      if (url === `${process.env.REACT_APP_API_URL}/auth/signup` && init?.method === 'POST') {
        // Verify request payload
        const body = JSON.parse(init.body as string);
        expect(body).toEqual({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

        // Store the userId in session storage (this is done by the SignupForm component)
        sessionStorage.setItem('userId', 'test-user-123');

        return {
          ok: true,
          json: async () => ({
            userId: 'test-user-123',
            token: 'mock-token',
            refreshToken: 'mock-refresh-token'
          })
        };
      }
      return { ok: false };
    });

    // Fill in the signup form
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form by clicking the submit button
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // After successful signup, we should be redirected to data-input
    // Note: DataInput is a protected route, so we need to be authenticated to see it
    await waitFor(() => {
      // First verify that we're authenticated
      expect(sessionStorage.getItem('userId')).toBe('test-user-123');
      expect(sessionStorage.getItem('accessToken')).toBe('mock-token');
      expect(sessionStorage.getItem('refreshToken')).toBe('mock-refresh-token');
      // Then verify we see the DataInput component
      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument();
    });
  });

  it('protects routes when not authenticated', async () => {
    // Try to access protected routes without authentication
    const protectedRoutes = ['/profile', '/data-input', '/connect-plaid'];

    for (const route of protectedRoutes) {
      window.history.pushState({}, '', route);
      render(<App />);

      // Should be redirected to login
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /log in to your account/i })).toBeInTheDocument();
      });

      // Cleanup after each render
      cleanup();
    }
  });
});
