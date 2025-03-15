import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../hooks/useForm';

describe('useForm', () => {
  const initialValues = {
    name: '',
    email: '',
    age: '',
    terms: false
  };

  const validate = (values: typeof initialValues) => {
    const errors: Partial<Record<keyof typeof initialValues, string>> = {};
    
    if (!values.name) {
      errors.name = 'Name is required';
    }
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!values.age) {
      errors.age = 'Age is required';
    } else if (isNaN(Number(values.age))) {
      errors.age = 'Age must be a number';
    }
    
    if (!values.terms) {
      errors.terms = 'You must accept the terms';
    }
    
    return errors;
  };

  it('should initialize with initial values', () => {
    const { result } = renderHook(() => useForm(initialValues));
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update values on handleChange', () => {
    const { result } = renderHook(() => useForm(initialValues));
    
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.values.name).toBe('John Doe');
  });

  it('should handle checkbox inputs correctly', () => {
    const { result } = renderHook(() => useForm(initialValues));
    
    act(() => {
      result.current.handleChange({
        target: { name: 'terms', checked: true, type: 'checkbox' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.values.terms).toBe(true);
  });

  it('should update touched state on handleBlur', () => {
    const { result } = renderHook(() => useForm(initialValues));
    
    act(() => {
      result.current.handleBlur({
        target: { name: 'name' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.touched.name).toBe(true);
  });

  it('should validate fields on blur when validate function is provided', () => {
    const { result } = renderHook(() => useForm(initialValues, validate));
    
    act(() => {
      result.current.handleBlur({
        target: { name: 'email' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.errors.email).toBe('Email is required');
  });

  it('should clear field error when field value changes', () => {
    const { result } = renderHook(() => useForm(initialValues, validate));
    
    // First set an error
    act(() => {
      result.current.setFieldError('email', 'Email is required');
    });
    
    expect(result.current.errors.email).toBe('Email is required');
    
    // Then change the field value
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.errors.email).toBeUndefined();
  });

  it('should set field value programmatically', () => {
    const { result } = renderHook(() => useForm(initialValues));
    
    act(() => {
      result.current.setFieldValue('name', 'John Doe');
    });
    
    expect(result.current.values.name).toBe('John Doe');
  });

  it('should reset form to initial values', () => {
    const { result } = renderHook(() => useForm(initialValues));
    
    // Change some values
    act(() => {
      result.current.setFieldValue('name', 'John Doe');
      result.current.setFieldValue('email', 'john@example.com');
      result.current.setFieldError('age', 'Age is required');
    });
    
    // Reset the form
    act(() => {
      result.current.resetForm();
    });
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle form submission with validation', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useForm(initialValues, validate));
    
    const submitEvent = {
      preventDefault: jest.fn()
    } as unknown as React.FormEvent;
    
    // Try to submit with invalid values
    await act(async () => {
      await result.current.handleSubmit(onSubmit)(submitEvent);
    });
    
    expect(submitEvent.preventDefault).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    
    // Fill in valid values
    act(() => {
      result.current.setFieldValue('name', 'John Doe');
      result.current.setFieldValue('email', 'john@example.com');
      result.current.setFieldValue('age', '30');
      result.current.setFieldValue('terms', true);
    });
    
    // Submit with valid values
    await act(async () => {
      await result.current.handleSubmit(onSubmit)(submitEvent);
    });
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      age: '30',
      terms: true
    });
  });
}); 