import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DataInput from '../../../components/pages/DataInput';

// Mock the essential hooks
jest.mock('../../../hooks/useUser', () => ({
  useUser: () => ({
    userId: 'test-user-id'
  })
}));

jest.mock('../../../hooks/useApi', () => ({
  useApi: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
    request: jest.fn().mockResolvedValue({ data: { message: 'Success' }, error: null })
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

describe('DataInput Component', () => {
  it('renders without crashing', () => {
    // Just verify it renders without errors
    render(
      <BrowserRouter>
        <DataInput />
      </BrowserRouter>
    );
    // Test passes if no errors are thrown
  });
});