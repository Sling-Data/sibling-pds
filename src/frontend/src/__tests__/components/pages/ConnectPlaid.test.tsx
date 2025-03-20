import '@testing-library/jest-dom';
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ConnectPlaid from '../../../components/pages/ConnectPlaid';
import { ApiProvider, NotificationProvider, UserProvider } from '../../../contexts';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: jest.fn(),
    useNavigate: jest.fn()
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('ConnectPlaid Component', () => {
  const useLocation = require('react-router-dom').useLocation;
  const useNavigate = require('react-router-dom').useNavigate;
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    (global.fetch as jest.Mock).mockReset();
  });

  it('shows loading state initially', async () => {
    // Mock location with userId
    useLocation.mockReturnValue({
      search: '?userId=test-user-id',
      pathname: '/connect-plaid'
    });

    // Mock fetch to never resolve to show loading state
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <NotificationProvider>
          <AuthProvider>
            <ApiProvider>
              <UserProvider>          
                <ConnectPlaid />
              </UserProvider>
            </ApiProvider>
          </AuthProvider>
        </NotificationProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Initializing connection to Plaid/i)).toBeInTheDocument();
  });

  it('shows error when API call fails', async () => {
    // Mock location with userId
    useLocation.mockReturnValue({
      search: '?userId=test-user-id',
      pathname: '/connect-plaid'
    });

    // Mock fetch to reject with an authentication error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Authentication failed. Please log in again.'));

    render(
      <MemoryRouter>
        <NotificationProvider>
          <AuthProvider>
            <ApiProvider>
              <UserProvider>          
                <ConnectPlaid />
              </UserProvider>
            </ApiProvider>
          </AuthProvider>
        </NotificationProvider>
      </MemoryRouter>
    );
    
    // Wait for the error to be displayed
    await waitFor(() => {
      // The error message is displayed with "Warning:" prefix
      const warningElement = screen.getByText(/Warning:/i);
      expect(warningElement).toBeInTheDocument();
      
      // Check that the parent container has the error message text
      const errorContainer = warningElement.closest('.error-message');
      expect(errorContainer).toHaveTextContent(/Authentication failed/i);
    });
  });

  it('shows connect button when link token is successfully fetched', async () => {
    // Mock location with userId
    useLocation.mockReturnValue({
      search: '?userId=test-user-id',
      pathname: '/connect-plaid'
    });

    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ link_token: 'test-link-token' })
    });

    render(
      <MemoryRouter>
        <NotificationProvider>
          <AuthProvider>
            <ApiProvider>
              <UserProvider>          
                <ConnectPlaid />
              </UserProvider>
            </ApiProvider>
          </AuthProvider>
        </NotificationProvider>
      </MemoryRouter>
    );
    
    // Wait for the button to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Connect Your Bank Account/i)).toBeInTheDocument();
    });
  });
});
