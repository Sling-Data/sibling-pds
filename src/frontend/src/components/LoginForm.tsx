import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useFetch } from '../hooks/useFetch';
import '../styles/AuthForm.css';
import { getUserId } from '../utils/TokenManager';
import { TextInput } from './atoms/TextInput';
import { Form } from './molecules/Form';

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

  // Format error message to be more user-friendly
  const getFormattedErrorMessage = (errorMsg: string) => {
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
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(getFormattedErrorMessage(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format any submit error from useFetch
  const formattedSubmitError = submitError ? getFormattedErrorMessage(submitError) : null;
  const displayError = error || formattedSubmitError;

  return (
    <div className="auth-form-container">
      <Form 
        onSubmit={handleSubmit}
        title="Log In to Your Account"
        submitText="Log In"
        isSubmitting={isSubmitting || submitLoading}
        error={displayError}
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
        
        <div className="text-center text-sm text-gray-600 mt-4">
          Don't have an account? <a href="/signup" className="text-blue-600 hover:text-blue-800">Sign up</a>
        </div>
      </Form>
    </div>
  );
};
