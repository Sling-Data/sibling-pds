import React from 'react';
import { useForm } from '../../hooks';
import { useNotificationContext } from '../../context';
import { ExamplesNav } from './ExamplesNav';

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  terms: boolean;
}

export const FormExample: React.FC = () => {
  const { addNotification } = useNotificationContext();
  
  const initialValues: FormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    terms: false
  };
  
  const validate = (values: FormValues) => {
    const errors: Partial<Record<keyof FormValues, string>> = {};
    
    if (!values.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!values.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!values.age) {
      errors.age = 'Age is required';
    } else if (isNaN(Number(values.age)) || Number(values.age) <= 0) {
      errors.age = 'Age must be a positive number';
    }
    
    if (!values.terms) {
      errors.terms = 'You must accept the terms';
    }
    
    return errors;
  };
  
  const handleSubmit = async (values: FormValues) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show success notification
    addNotification(`Form submitted successfully for ${values.name}!`, 'success');
    
    // Reset form
    resetForm();
  };
  
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit: submitForm,
    resetForm
  } = useForm<FormValues>(initialValues, validate);
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ExamplesNav />
      
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Registration Form</h2>
        
        <form onSubmit={submitForm(handleSubmit)}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-red-500 text-sm">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-red-500 text-sm">{errors.password}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-red-500 text-sm">{errors.confirmPassword}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="age" className="block text-gray-700 font-medium mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={values.age}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-md ${
                touched.age && errors.age ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {touched.age && errors.age && (
              <p className="mt-1 text-red-500 text-sm">{errors.age}</p>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={values.terms}
                onChange={handleChange}
                className={`mr-2 ${touched.terms && errors.terms ? 'border-red-500' : ''}`}
              />
              <label htmlFor="terms" className="text-gray-700">
                I accept the terms and conditions
              </label>
            </div>
            {touched.terms && errors.terms && (
              <p className="mt-1 text-red-500 text-sm">{errors.terms}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Register'}
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-600 hover:text-gray-800"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 