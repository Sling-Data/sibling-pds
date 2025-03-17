// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from '../../../components/atoms/TextInput';

describe('TextInput Component', () => {
  const defaultProps = {
    id: 'test-input',
    name: 'test-input',
    value: '',
    onChange: jest.fn(),
  };

  test('renders correctly with default props', () => {
    render(<TextInput {...defaultProps} />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('id', 'test-input');
    expect(inputElement).toHaveAttribute('name', 'test-input');
  });

  test('renders with label when provided', () => {
    render(<TextInput {...defaultProps} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('shows required indicator when required is true', () => {
    render(<TextInput {...defaultProps} label="Test Label" required />);
    const label = screen.getByText('Test Label');
    expect(label.parentElement).toHaveTextContent('*');
  });

  test('shows error message when error is provided', () => {
    const errorMessage = 'This field is required';
    render(<TextInput {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('applies disabled styles when disabled is true', () => {
    render(<TextInput {...defaultProps} disabled />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeDisabled();
  });

  test('calls onChange handler when input value changes', () => {
    const handleChange = jest.fn();
    render(<TextInput {...defaultProps} onChange={handleChange} />);
    
    const inputElement = screen.getByRole('textbox');
    fireEvent.change(inputElement, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('renders with different input types', () => {
    render(<TextInput {...defaultProps} type="email" />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveAttribute('type', 'email');
  });

  test('applies custom className when provided', () => {
    render(<TextInput {...defaultProps} className="custom-class" />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement.className).toContain('custom-class');
  });
}); 