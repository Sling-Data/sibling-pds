// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckboxGroup } from '../../components/atoms/CheckboxGroup';

describe('CheckboxGroup Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    name: 'test-checkbox-group',
    options,
    selectedValues: [],
    onChange: jest.fn(),
  };

  test('renders correctly with default props', () => {
    render(<CheckboxGroup {...defaultProps} />);
    
    // Check if all options are rendered
    options.forEach(option => {
      const checkboxElement = screen.getByLabelText(option.label);
      expect(checkboxElement).toBeInTheDocument();
      expect(checkboxElement).toHaveAttribute('name', 'test-checkbox-group');
      expect(checkboxElement).toHaveAttribute('value', option.value);
      expect(checkboxElement).not.toBeChecked();
    });
  });

  test('renders with label when provided', () => {
    render(<CheckboxGroup {...defaultProps} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('shows required indicator when required is true', () => {
    render(<CheckboxGroup {...defaultProps} label="Test Label" required />);
    const labelContainer = screen.getByText('Test Label').parentElement;
    expect(labelContainer).toHaveTextContent('*');
  });

  test('checks the correct options based on selectedValues prop', () => {
    render(<CheckboxGroup {...defaultProps} selectedValues={['option1', 'option3']} />);
    
    const option1 = screen.getByLabelText('Option 1');
    const option2 = screen.getByLabelText('Option 2');
    const option3 = screen.getByLabelText('Option 3');
    
    expect(option1).toBeChecked();
    expect(option2).not.toBeChecked();
    expect(option3).toBeChecked();
  });

  test('shows error message when error is provided', () => {
    const errorMessage = 'Please select at least one option';
    render(<CheckboxGroup {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('applies disabled styles when disabled is true', () => {
    render(<CheckboxGroup {...defaultProps} disabled />);
    
    options.forEach(option => {
      const checkboxElement = screen.getByLabelText(option.label);
      expect(checkboxElement).toBeDisabled();
    });
  });

  test('calls onChange handler with updated values when a checkbox is clicked', () => {
    const handleChange = jest.fn();
    render(<CheckboxGroup {...defaultProps} onChange={handleChange} />);
    
    const option2 = screen.getByLabelText('Option 2');
    fireEvent.click(option2);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(['option2']);
  });

  test('adds to selectedValues when checking a checkbox', () => {
    const handleChange = jest.fn();
    render(
      <CheckboxGroup 
        {...defaultProps} 
        selectedValues={['option1']} 
        onChange={handleChange} 
      />
    );
    
    const option3 = screen.getByLabelText('Option 3');
    fireEvent.click(option3);
    
    expect(handleChange).toHaveBeenCalledWith(['option1', 'option3']);
  });

  test('removes from selectedValues when unchecking a checkbox', () => {
    const handleChange = jest.fn();
    render(
      <CheckboxGroup 
        {...defaultProps} 
        selectedValues={['option1', 'option2']} 
        onChange={handleChange} 
      />
    );
    
    const option1 = screen.getByLabelText('Option 1');
    fireEvent.click(option1);
    
    expect(handleChange).toHaveBeenCalledWith(['option2']);
  });

  test('applies custom className when provided', () => {
    render(<CheckboxGroup {...defaultProps} className="custom-class" />);
    const containerElement = screen.getByLabelText('Option 1').closest('.mb-4');
    expect(containerElement).toHaveClass('custom-class');
  });
}); 