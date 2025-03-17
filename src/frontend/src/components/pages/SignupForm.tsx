import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useFetch } from '../../hooks/useFetch';
import '../../styles/AuthForm.css';
import { TextInput } from '../atoms/TextInput';
import { Form } from '../molecules/Form';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  submit?: string;
}

interface SignupResponse {
  userId: string;
  token: string;
  refreshToken: string;
  message?: string;
}

export const SignupForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, setUserId, checkUserDataAndNavigate } = useUser();

  // Setup useFetch for signup
  const { loading: submitLoading, error: submitError, update: submitSignup } = useFetch<SignupResponse>(
    null,
    {
      method: 'POST',
      skipCache: true,
      retryOnAuth: false,
      skipAuth: true
    }
  );

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
      const result = await submitSignup(
        `${process.env.REACT_APP_API_URL}/auth/signup`,
        {
          method: 'POST',
          body: {
            name,
            email,
            password,
          }
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      const data = result.data;
      if (!data) {
        throw new Error('No response data received');
      }

      // Store tokens using context
      login(data.token, data.refreshToken);
      
      // Set userId from response
      setUserId(data.userId);
      
      // Navigate to the appropriate page based on user data
      checkUserDataAndNavigate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setErrors({
        submit: getFormattedErrorMessage(errorMessage)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the submit error message
  const submitErrorMessage = errors.submit || (submitError ? getFormattedErrorMessage(submitError) : null);

  return (
    <div className="auth-form-container">
      <Form
        onSubmit={handleSubmit}
        title="Create Your Account"
        submitText={isSubmitting || submitLoading ? 'Creating Account...' : 'Create Account'}
        isSubmitting={isSubmitting || submitLoading}
        error={submitErrorMessage}
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
          {errors.name && <div className="error-message">{errors.name}</div>}
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
          {errors.email && <div className="error-message">{errors.email}</div>}
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
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>
        
        <div className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <a href="/login" className="text-blue-600 hover:text-blue-800">Log in</a>
        </div>
      </Form>
    </div>
  );
};