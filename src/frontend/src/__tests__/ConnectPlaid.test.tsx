import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ConnectPlaid from '../components/ConnectPlaid';
import { UserProvider } from '../context/UserContext';

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
      <BrowserRouter>
        <UserProvider initialUserId="test-user-id">
          <ConnectPlaid />
        </UserProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Initializing connection to Plaid/i)).toBeInTheDocument();
  });

  it('shows error when API call fails', async () => {
    // Mock location with userId
    useLocation.mockReturnValue({
      search: '?userId=test-user-id',
      pathname: '/connect-plaid'
    });

    // Mock fetch to reject
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <BrowserRouter>
        <UserProvider initialUserId="test-user-id">
          <ConnectPlaid />
        </UserProvider>
      </BrowserRouter>
    );
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
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
      <BrowserRouter>
        <UserProvider initialUserId="test-user-id">
          <ConnectPlaid />
        </UserProvider>
      </BrowserRouter>
    );
    
    // Wait for the button to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Connect Your Bank Account/i)).toBeInTheDocument();
    });
  });
});
