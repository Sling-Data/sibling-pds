// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioGroup } from '../../components/atoms/RadioGroup';

describe('RadioGroup Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    name: 'test-radio',
    options,
    value: '',
    onChange: jest.fn(),
  };

  test('renders correctly with default props', () => {
    render(<RadioGroup {...defaultProps} />);
    
    // Check if all options are rendered
    options.forEach(option => {
      const radioElement = screen.getByLabelText(option.label);
      expect(radioElement).toBeInTheDocument();
      expect(radioElement).toHaveAttribute('name', 'test-radio');
      expect(radioElement).toHaveAttribute('value', option.value);
      expect(radioElement).not.toBeChecked();
    });
  });

  test('renders with label when provided', () => {
    render(<RadioGroup {...defaultProps} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('shows required indicator when required is true', () => {
    render(<RadioGroup {...defaultProps} label="Test Label" required />);
    const labelContainer = screen.getByText('Test Label').parentElement;
    expect(labelContainer).toHaveTextContent('*');
  });

  test('selects the correct option based on value prop', () => {
    render(<RadioGroup {...defaultProps} value="option2" />);
    
    const option1 = screen.getByLabelText('Option 1');
    const option2 = screen.getByLabelText('Option 2');
    const option3 = screen.getByLabelText('Option 3');
    
    expect(option1).not.toBeChecked();
    expect(option2).toBeChecked();
    expect(option3).not.toBeChecked();
  });

  test('shows error message when error is provided', () => {
    const errorMessage = 'Please select an option';
    render(<RadioGroup {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('applies disabled styles when disabled is true', () => {
    render(<RadioGroup {...defaultProps} disabled />);
    
    options.forEach(option => {
      const radioElement = screen.getByLabelText(option.label);
      expect(radioElement).toBeDisabled();
    });
  });

  test('calls onChange handler when an option is selected', () => {
    const handleChange = jest.fn();
    render(<RadioGroup {...defaultProps} onChange={handleChange} />);
    
    const option2 = screen.getByLabelText('Option 2');
    fireEvent.click(option2);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('applies custom className when provided', () => {
    render(<RadioGroup {...defaultProps} className="custom-class" />);
    const containerElement = screen.getByLabelText('Option 1').closest('.mb-4');
    expect(containerElement).toHaveClass('custom-class');
  });
}); 