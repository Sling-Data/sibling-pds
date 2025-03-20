import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ConnectGmail from '../../../components/pages/ConnectGmail';

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
    request: jest.fn().mockResolvedValue({ data: { authUrl: 'https://example.com/auth' }, error: null })
  })
}));

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn().mockReturnValue(jest.fn())
  };
});

// Mock window.open
window.open = jest.fn().mockReturnValue({ 
  closed: false, 
  close: jest.fn(),
  focus: jest.fn()
});

describe('ConnectGmail Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <ConnectGmail />
      </BrowserRouter>
    );
    // Test passes if no errors are thrown
  });
}); 