// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormSection } from '../../../components/molecules/FormSection';

describe('FormSection Component', () => {
  test('renders children correctly', () => {
    render(
      <FormSection>
        <div data-testid="test-child">Test Child Content</div>
      </FormSection>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  test('renders title when provided', () => {
    render(
      <FormSection title="Test Title">
        <div>Test Content</div>
      </FormSection>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders description when provided', () => {
    render(
      <FormSection 
        title="Test Title" 
        description="This is a test description"
      >
        <div>Test Content</div>
      </FormSection>
    );
    
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  test('does not render title when not provided', () => {
    render(
      <FormSection>
        <div>Test Content</div>
      </FormSection>
    );
    
    const titleElement = screen.queryByRole('heading');
    expect(titleElement).not.toBeInTheDocument();
  });

  test('does not render description when not provided', () => {
    render(
      <FormSection title="Test Title">
        <div>Test Content</div>
      </FormSection>
    );
    
    // This is a bit of a hack since we don't have a specific way to identify the description
    // We're checking that there's no paragraph element with a text-gray-500 class
    const descriptionElements = document.querySelectorAll('p.text-gray-500');
    expect(descriptionElements.length).toBe(0);
  });

  test('applies custom className when provided', () => {
    const { container } = render(
      <FormSection className="custom-class">
        <div>Test Content</div>
      </FormSection>
    );
    
    const sectionElement = container.firstChild;
    expect(sectionElement).toHaveClass('custom-class');
  });
}); 