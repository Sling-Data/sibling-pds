import React, { useState } from 'react';
import '../styles/AuthForm.css';
import { useUser } from '../context/UserContext';
import { useFetch } from '../hooks/useFetch';

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
  const { login, setUserId } = useUser();

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
    console.log({newErrors}); 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to sign up'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Create Your Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>
        
        {(errors.submit || submitError) && (
          <div className="error-message submit-error">{errors.submit || submitError}</div>
        )}
        
        <button type="submit" disabled={isSubmitting || submitLoading}>
          {isSubmitting || submitLoading ? 'Creating Account...' : 'Create Account'}
        </button>
        
        <div className="login-link">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </form>
    </div>
  );
};