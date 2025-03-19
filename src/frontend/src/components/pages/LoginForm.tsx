import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/AuthForm.css';
import { TextInput } from '../atoms/TextInput';
import { Form } from '../molecules/Form';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const { login, checkUserDataAndNavigate } = useAuth();

  // Format error message to be more user-friendly
  const getFormattedErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes('400')) {
      return 'Invalid login credentials. Please check your email and password.';
    }
    if (errorMsg.includes('401')) {
      return 'Invalid email or password. Please try again.';
    }
    if (errorMsg.includes('404')) {
      return 'Login service is not available. Please try again later.';
    }
    if (errorMsg.includes('Network Error') || errorMsg.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return errorMsg;
  };

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const result = await login({
        email,
        password
      });

      if (!result.data) {
        throw new Error(result.error || 'Login failed');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        checkUserDataAndNavigate();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(getFormattedErrorMessage(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <Form 
        onSubmit={handleSubmit}
        title="Log In to Your Account"
        submitText="Log In"
        isSubmitting={isSubmitting}
        error={error}
      >
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
          {fieldErrors.email && <div className="error-message">{fieldErrors.email}</div>}
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
          {fieldErrors.password && <div className="error-message">{fieldErrors.password}</div>}
        </div>
        
        <div className="text-center text-sm text-gray-600 mt-4">
          Don't have an account? <a href="/signup" className="text-blue-600 hover:text-blue-800">Sign up</a>
        </div>
      </Form>
    </div>
  );
};
