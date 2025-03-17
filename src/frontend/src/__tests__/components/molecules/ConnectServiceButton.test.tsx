import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectServiceButton } from '../../../components/molecules/ConnectServiceButton';

// Mock the Button component to avoid testing its implementation
jest.mock('../../../components/atoms/Button', () => ({
  Button: ({ 
    children, 
    onClick, 
    disabled, 
    isLoading, 
    variant 
  }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    disabled?: boolean; 
    isLoading?: boolean; 
    variant?: string; 
  }) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-loading={isLoading ? 'true' : 'false'}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

describe('ConnectServiceButton Component', () => {
  const defaultProps = {
    serviceName: 'Gmail',
    onClick: jest.fn(),
  };

  test('renders correctly with default props', () => {
    render(<ConnectServiceButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Connect Gmail');
  });

  test('renders with service icon when provided', () => {
    const serviceIcon = <span data-testid="test-icon">Icon</span>;
    render(<ConnectServiceButton {...defaultProps} serviceIcon={serviceIcon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  test('renders connected state when isConnected is true', () => {
    render(<ConnectServiceButton {...defaultProps} isConnected={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Gmail Connected');
    expect(button).toHaveAttribute('data-variant', 'success');
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  test('renders loading state when isLoading is true', () => {
    render(<ConnectServiceButton {...defaultProps} isLoading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-loading', 'true');
  });

  test('disables button when isLoading is true', () => {
    render(<ConnectServiceButton {...defaultProps} isLoading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('disables button when isConnected is true', () => {
    render(<ConnectServiceButton {...defaultProps} isConnected={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('calls onClick handler when button is clicked', () => {
    const handleClick = jest.fn();
    render(<ConnectServiceButton {...defaultProps} onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom className when provided', () => {
    render(<ConnectServiceButton {...defaultProps} className="custom-class" />);
    
    const containerElement = screen.getByRole('button').closest('div');
    if (containerElement && containerElement.parentElement) {
      expect(containerElement.parentElement).toHaveClass('custom-class');
    }
  });
}); 