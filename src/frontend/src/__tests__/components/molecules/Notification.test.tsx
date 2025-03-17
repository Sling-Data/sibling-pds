// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Notification } from '../../../components/molecules/Notification';

describe('Notification', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    id: 'test-id',
    message: 'Test notification message',
    type: 'info' as const,
    onClose: mockOnClose
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders the notification with the correct message', () => {
    render(<Notification {...defaultProps} />);
    expect(screen.getByText('Test notification message')).toBeInTheDocument();
  });

  it('applies the correct styles based on type', () => {
    const { rerender, container } = render(<Notification {...defaultProps} type="info" />);
    expect(container.firstChild).toHaveClass('bg-blue-100');
    expect(container.firstChild).toHaveClass('border-blue-500');
    expect(container.firstChild).toHaveClass('text-blue-700');

    rerender(<Notification {...defaultProps} type="success" />);
    expect(container.firstChild).toHaveClass('bg-green-100');
    expect(container.firstChild).toHaveClass('border-green-500');
    expect(container.firstChild).toHaveClass('text-green-700');

    rerender(<Notification {...defaultProps} type="error" />);
    expect(container.firstChild).toHaveClass('bg-red-100');
    expect(container.firstChild).toHaveClass('border-red-500');
    expect(container.firstChild).toHaveClass('text-red-700');

    rerender(<Notification {...defaultProps} type="warning" />);
    expect(container.firstChild).toHaveClass('bg-yellow-100');
    expect(container.firstChild).toHaveClass('border-yellow-500');
    expect(container.firstChild).toHaveClass('text-yellow-700');
  });

  it('calls onClose with the correct id when close button is clicked', () => {
    render(<Notification {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledWith('test-id');
  });
}); 