import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../../../components/pages/Profile';

// Mock the essential hooks
jest.mock('../../../hooks/useUser', () => ({
  useUser: () => ({
    userId: null, // Set to null to render the "No user ID provided" state
  })
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    refreshTokens: jest.fn().mockResolvedValue(true)
  })
}));

jest.mock('../../../hooks/useApi', () => ({
  useApi: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
    request: jest.fn()
  })
}));

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: jest.fn().mockReturnValue({ search: '' }),
    useNavigate: jest.fn().mockReturnValue(jest.fn())
  };
});

describe('Profile Component', () => {
  it('renders without crashing', () => {
    // Just verify it renders without errors
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    // Test passes if no errors are thrown
  });
});