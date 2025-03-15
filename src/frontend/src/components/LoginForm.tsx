import React, { useState } from 'react';
import '../styles/AuthForm.css'; 
import { useUser } from '../context/UserContext';
import { useFetch } from '../hooks/useFetch';
import { getUserId } from '../utils/TokenManager';

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
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {(error || submitError) && (
          <div className="error-message">{error || submitError}</div>
        )}

        <button type="submit" disabled={isSubmitting || submitLoading}>
          {isSubmitting || submitLoading ? 'Logging in...' : 'Log In'}
        </button>

        <div className="signup-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </div>
      </form>
    </div>
  );
};
