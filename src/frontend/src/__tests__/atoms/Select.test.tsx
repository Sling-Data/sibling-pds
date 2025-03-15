// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../../components/atoms/Select';

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    id: 'test-select',
    name: 'test-select',
    options,
    value: '',
    onChange: jest.fn(),
  };

  test('renders correctly with default props', () => {
    render(<Select {...defaultProps} />);
    
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
    expect(selectElement).toHaveAttribute('id', 'test-select');
    expect(selectElement).toHaveAttribute('name', 'test-select');
    
    // Check if placeholder option is rendered
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    
    // Check if all options are rendered
    options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  test('renders with label when provided', () => {
    render(<Select {...defaultProps} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('shows required indicator when required is true', () => {
    render(<Select {...defaultProps} label="Test Label" required />);
    const label = screen.getByText('Test Label');
    expect(label.parentElement).toHaveTextContent('*');
  });

  test('selects the correct option based on value prop', () => {
    render(<Select {...defaultProps} value="option2" />);
    
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('option2');
  });

  test('shows error message when error is provided', () => {
    const errorMessage = 'Please select an option';
    render(<Select {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('applies disabled styles when disabled is true', () => {
    render(<Select {...defaultProps} disabled />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeDisabled();
  });

  test('calls onChange handler when an option is selected', () => {
    const handleChange = jest.fn();
    render(<Select {...defaultProps} onChange={handleChange} />);
    
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'option2' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('applies custom className when provided', () => {
    render(<Select {...defaultProps} className="custom-class" />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement.className).toContain('custom-class');
  });

  test('uses custom placeholder when provided', () => {
    render(<Select {...defaultProps} placeholder="Choose an option" />);
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });
}); 