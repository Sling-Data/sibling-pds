// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '../../components/atoms/Checkbox';

describe('Checkbox Component', () => {
  const defaultProps = {
    id: 'test-checkbox',
    name: 'test-checkbox',
    label: 'Test Checkbox',
    checked: false,
    onChange: jest.fn(),
  };

  test('renders correctly with default props', () => {
    render(<Checkbox {...defaultProps} />);
    const checkboxElement = screen.getByRole('checkbox');
    const labelElement = screen.getByText('Test Checkbox');
    
    expect(checkboxElement).toBeInTheDocument();
    expect(labelElement).toBeInTheDocument();
    expect(checkboxElement).toHaveAttribute('id', 'test-checkbox');
    expect(checkboxElement).toHaveAttribute('name', 'test-checkbox');
    expect(checkboxElement).not.toBeChecked();
  });

  test('renders as checked when checked prop is true', () => {
    render(<Checkbox {...defaultProps} checked={true} />);
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toBeChecked();
  });

  test('shows error message when error is provided', () => {
    const errorMessage = 'This field is required';
    render(<Checkbox {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('applies disabled styles when disabled is true', () => {
    render(<Checkbox {...defaultProps} disabled />);
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toBeDisabled();
  });

  test('calls onChange handler when checkbox is clicked', () => {
    const handleChange = jest.fn();
    render(<Checkbox {...defaultProps} onChange={handleChange} />);
    
    const checkboxElement = screen.getByRole('checkbox');
    fireEvent.click(checkboxElement);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('applies custom className when provided', () => {
    const { container } = render(<Checkbox {...defaultProps} className="custom-class" />);
    const containerElement = container.firstChild;
    expect(containerElement).toHaveClass('custom-class');
  });
}); 