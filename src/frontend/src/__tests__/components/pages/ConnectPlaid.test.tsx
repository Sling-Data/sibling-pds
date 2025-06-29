import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ConnectPlaid from '../../../components/pages/ConnectPlaid';

// Mock the hooks
jest.mock('../../../hooks/useUser', () => ({
  useUser: () => ({
    userId: 'test-user-id'
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
    request: jest.fn().mockResolvedValue({ data: { link_token: 'test-link-token' }, error: null })
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

// Mock react-plaid-link
jest.mock('react-plaid-link', () => ({
  usePlaidLink: jest.fn().mockReturnValue({
    open: jest.fn(),
    ready: true
  })
}));

describe('ConnectPlaid Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <ConnectPlaid />
      </BrowserRouter>
    );
    // Test passes if no errors are thrown
  });
});
