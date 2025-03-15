// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusMessage } from '../../components/atoms/StatusMessage';

describe('StatusMessage Component', () => {
  const defaultProps = {
    message: 'Test message',
    type: 'info' as const,
  };

  test('renders correctly with default props', () => {
    render(<StatusMessage {...defaultProps} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('renders success message with correct styles', () => {
    render(<StatusMessage message="Success message" type="success" />);
    const messageElement = screen.getByText('Success message');
    const containerElement = messageElement.closest('.p-4');
    expect(containerElement).toHaveClass('bg-green-50');
    expect(containerElement).toHaveClass('text-green-800');
  });

  test('renders error message with correct styles', () => {
    render(<StatusMessage message="Error message" type="error" />);
    const messageElement = screen.getByText('Error message');
    const containerElement = messageElement.closest('.p-4');
    expect(containerElement).toHaveClass('bg-red-50');
    expect(containerElement).toHaveClass('text-red-800');
  });

  test('renders warning message with correct styles', () => {
    render(<StatusMessage message="Warning message" type="warning" />);
    const messageElement = screen.getByText('Warning message');
    const containerElement = messageElement.closest('.p-4');
    expect(containerElement).toHaveClass('bg-yellow-50');
    expect(containerElement).toHaveClass('text-yellow-800');
  });

  test('renders info message with correct styles', () => {
    render(<StatusMessage message="Info message" type="info" />);
    const messageElement = screen.getByText('Info message');
    const containerElement = messageElement.closest('.p-4');
    expect(containerElement).toHaveClass('bg-blue-50');
    expect(containerElement).toHaveClass('text-blue-800');
  });

  test('renders dismiss button when onDismiss prop is provided', () => {
    const handleDismiss = jest.fn();
    render(<StatusMessage {...defaultProps} onDismiss={handleDismiss} />);
    
    const dismissButton = screen.getByRole('button');
    expect(dismissButton).toBeInTheDocument();
  });

  test('calls onDismiss handler when dismiss button is clicked', () => {
    const handleDismiss = jest.fn();
    render(<StatusMessage {...defaultProps} onDismiss={handleDismiss} />);
    
    const dismissButton = screen.getByRole('button');
    fireEvent.click(dismissButton);
    
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  test('does not render dismiss button when onDismiss is not provided', () => {
    render(<StatusMessage {...defaultProps} />);
    const dismissButton = screen.queryByRole('button');
    expect(dismissButton).not.toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    render(<StatusMessage {...defaultProps} className="custom-class" />);
    const messageElement = screen.getByText('Test message');
    const containerElement = messageElement.closest('.p-4');
    expect(containerElement).toHaveClass('custom-class');
  });
}); 