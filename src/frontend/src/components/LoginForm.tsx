import React, { useState } from 'react';
import '../styles/AuthForm.css';
import { useUser } from '../context/UserContext';
import { useFetch } from '../hooks/useFetch';
import { getUserId } from '../utils/TokenManager';
import { TextInput } from './atoms/TextInput';
import { Button } from './atoms/Button';
import { StatusMessage } from './atoms/StatusMessage';

interface LoginFormProps {
  onSuccess?: () => void;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  message?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, setUserId: setContextUserId, checkUserDataAndNavigate } = useUser();

  // Setup useFetch for login
  const { loading: submitLoading, error: submitError, update: submitLogin } = useFetch<LoginResponse>(
    null,
    {
      method: 'POST',
      skipCache: true,
      retryOnAuth: false,
      skipAuth: true
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await submitLogin(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        {
          method: 'POST',
          body: { email, password }
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      const data = result.data;
      if (!data) {
        throw new Error('No response data received');
      }

      login(data.token, data.refreshToken);
      
      // Get userId from the token after login
      const userId = getUserId();
      if (userId) {
        setContextUserId(userId);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        checkUserDataAndNavigate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Log In to Your Account</h2>
      
      <form onSubmit={handleSubmit}>
        {(error || submitError) && (
          <StatusMessage 
            type="error" 
            message={error || submitError || ''} 
          />
        )}
        
        <div className="form-group">
          <TextInput
            id="email"
            name="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
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
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={isSubmitting || submitLoading}
          isLoading={isSubmitting || submitLoading}
          variant="primary"
          fullWidth
        >
          Log In
        </Button>
        
        <div className="text-center text-sm text-gray-600 mt-4">
          Don't have an account? <a href="/signup" className="text-blue-600 hover:text-blue-800">Sign up</a>
        </div>
      </form>
    </div>
  );
};
