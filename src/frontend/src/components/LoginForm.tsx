import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SignupForm.css'; // Reuse the same styles for now
import { useUser } from '../context/UserContext';

interface FormErrors {
  userId?: string;
  password?: string;
  submit?: string;
}

export default function LoginForm() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setUserId: setUserIdContext, setToken, setRefreshToken } = useUser();

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!userId.trim()) {
      newErrors.userId = 'User ID is required';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrors({
            submit: 'Invalid credentials'
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store tokens using context
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      
      // Update user context
      setUserIdContext(userId);
      
      // Navigate to profile page
      navigate('/profile');
    } catch (error) {
      setErrors({
        submit: 'Failed to log in'
      });
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
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
          />
          {errors.userId && <div className="error-message">{errors.userId}</div>}
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
        
        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}
        
        <button type="submit" disabled={isSubmitting}>
          Log In
        </button>
        
        <div className="signup-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </div>
      </form>
    </div>
  );
}
