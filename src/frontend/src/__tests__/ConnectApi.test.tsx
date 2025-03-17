// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ConnectApi from '../components/molecules/ConnectApi';

// Mock navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('ConnectApi Component', () => {
  const defaultProps = {
    title: 'Test Connection',
    serviceName: 'TestService',
    isLoading: false,
    error: null,
    onConnect: jest.fn(),
    onCancel: jest.fn(),
    isConnectDisabled: false,
    loadingMessage: 'Loading test service...',
    connectButtonText: 'Connect to Test',
    cancelButtonText: 'Cancel Test',
    redirectPath: '/test-path',
    showSpinner: true
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <ConnectApi {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    renderComponent();
    expect(screen.getByText('Test Connection')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    renderComponent({ isLoading: true });
    expect(screen.getByText('Loading test service...')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    renderComponent({ error: 'Test error message' });
    expect(screen.getByText('Warning:')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows connect button in normal state', () => {
    renderComponent();
    expect(screen.getByText('Connect to Test')).toBeInTheDocument();
  });

  it('disables connect button when isConnectDisabled is true', () => {
    renderComponent({ isConnectDisabled: true });
    expect(screen.getByText('Connect to Test')).toBeDisabled();
  });

  it('calls onConnect when connect button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Connect to Test'));
    expect(defaultProps.onConnect).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Cancel Test'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows connect button even when there is an error', () => {
    renderComponent({ error: 'Test error' });
    expect(screen.getByText('Connect to Test')).toBeInTheDocument();
  });

  it('does not show spinner when showSpinner is false', () => {
    renderComponent({ showSpinner: false });
    const spinnerElements = document.querySelectorAll('.spinner');
    expect(spinnerElements.length).toBe(0);
  });
}); 