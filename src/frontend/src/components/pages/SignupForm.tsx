import React, { useState } from 'react';
import '../../styles/pages/AuthForm.css';
import { TextInput } from '../atoms/TextInput';
import { Alert } from '../atoms/Alert';
import { Form } from '../molecules/Form';
import { useAuth, useUser } from '../../hooks';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  submit?: string;
}

export const SignupForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get auth methods from useAuth
  const { signup, checkUserDataAndNavigate } = useAuth();
  
  // Get the setUserId method from useUser if available
  // Note: This is wrapped in a try/catch because useUser needs to be
  // used within UserProviderNew, and we don't want to crash if it's not available
  let setUserId: ((id: string | null) => void) | undefined;
  try {
    const userHook = useUser();
    setUserId = userHook.setUserId;
  } catch (error) {
    // If useUser can't be used, we'll rely only on useAuth
    console.log('UserProviderNew not available, using only AuthContext');
  }

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format error message to be more user-friendly
  const getFormattedErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes('400')) {
      return 'Invalid signup data. This email may already be registered.';
    }
    if (errorMsg.includes('409')) {
      return 'This email is already registered. Please use a different email or log in.';
    }
    if (errorMsg.includes('404')) {
      return 'Signup service is not available. Please try again later.';
    }
    if (errorMsg.includes('Network Error') || errorMsg.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return errorMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Use the signup method from useAuth
      const result = await signup({
        name,
        email,
        password
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const data = result.data;
      if (!data) {
        throw new Error('No response data received');
      }

      // If useUser is available, set the userId - ensuring it's not undefined
      if (setUserId && data.userId) {
        setUserId(data.userId);
      }
      
      // Navigate to the appropriate page based on user data
      await checkUserDataAndNavigate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setErrors({
        submit: getFormattedErrorMessage(errorMessage)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <Form
        onSubmit={handleSubmit}
        title="Create Your Account"
        submitText={isSubmitting ? 'Creating Account...' : 'Create Account'}
        isSubmitting={isSubmitting}
        error={errors.submit}
      >
        <div className="form-group">
          <TextInput
            id="name"
            name="name"
            type="text"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required={false}
          />
          {errors.name && <Alert type="error" message={errors.name} variant="inline" />}
        </div>
        
        <div className="form-group">
          <TextInput
            id="email"
            name="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required={false}
          />
          {errors.email && <Alert type="error" message={errors.email} variant="inline" />}
        </div>
        
        <div className="form-group">
          <TextInput
            id="password"
            name="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required={false}
          />
          {errors.password && <Alert type="error" message={errors.password} variant="inline" />}
        </div>
        
        <div className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <a href="/login" className="text-blue-600 hover:text-blue-800">Log in</a>
        </div>
      </Form>
    </div>
  );
};