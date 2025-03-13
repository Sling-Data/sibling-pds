import React, { useState } from 'react';
import '../styles/AuthForm.css'; 
import { useUser } from '../context/UserContext';
import { useFetch } from '../hooks/useFetch';

interface LoginFormProps {
  onSuccess?: () => void;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  message?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [userId, setUserId] = useState('');
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
          body: { userId, password }
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
      setContextUserId(userId); 
      
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
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID"
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
