// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../components/App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock the UserContext hook
jest.mock('../contexts/UserContextOld', () => ({
  ...jest.requireActual('../contexts/UserContextOld'),
  useUser: () => ({
    isAuthenticated: false,
    setIsAuthenticated: jest.fn()
  })
}));

describe('App Component', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders public routes for unauthenticated users', () => {
    // Root path
    window.history.pushState({}, '', '/');
    const { unmount } = render(<App />);
    expect(window.location.pathname).toBe('/login'); // Should redirect to login
    unmount();

    // Login path
    window.history.pushState({}, '', '/login');
    const { unmount: unmount2 } = render(<App />);
    expect(window.location.pathname).toBe('/login');
    unmount2();

    // Signup path
    window.history.pushState({}, '', '/signup');
    const { unmount: unmount3 } = render(<App />);
    expect(window.location.pathname).toBe('/signup');
    unmount3();
  });

  it('redirects to login for protected routes when not authenticated', () => {
    const protectedRoutes = ['/profile', '/data-input', '/connect-plaid'];

    protectedRoutes.forEach(route => {
      window.history.pushState({}, '', route);
      const { unmount } = render(<App />);
      expect(window.location.pathname).toBe('/login');
      unmount();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      // Mock the UserContext for authenticated state
      jest.spyOn(require('../contexts/UserContextOld'), 'useUser').mockImplementation(() => ({
        isAuthenticated: true,
        setIsAuthenticated: jest.fn()
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('allows access to protected routes', () => {
      const protectedRoutes = ['/profile', '/data-input', '/connect-plaid'];

      protectedRoutes.forEach(route => {
        window.history.pushState({}, '', route);
        const { unmount } = render(<App />);
        expect(window.location.pathname).toBe(route);
        unmount();
      });
    });

    it('redirects from public routes to appropriate pages', () => {
      // Login should redirect to profile
      window.history.pushState({}, '', '/login');
      const { unmount } = render(<App />);
      expect(window.location.pathname).toBe('/profile');
      unmount();

      // Signup should redirect to data-input
      window.history.pushState({}, '', '/signup');
      const { unmount: unmount2 } = render(<App />);
      expect(window.location.pathname).toBe('/data-input');
      unmount2();
    });
  });
});
