import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SignupForm.css';
import { useUser } from '../context/UserContext';

interface SignupFormProps {
  onSuccess: (userId: string) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  submit?: string;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setUserId, setToken, setRefreshToken } = useUser();

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required';
    } else if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
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
      // First create the user
      const userResponse = await fetch(`${process.env.REACT_APP_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!userResponse.ok) {
        throw new Error(`HTTP error! status: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const userId = userData._id;

      // Then sign up with auth endpoint
      const authResponse = await fetch(`${process.env.REACT_APP_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password,
        }),
      });

      if (!authResponse.ok) {
        throw new Error(`Auth HTTP error! status: ${authResponse.status}`);
      }

      const authData = await authResponse.json();
      
      // Store tokens using context
      setToken(authData.token);
      setRefreshToken(authData.refreshToken);
      
      // Update user context
      setUserId(userId);
      
      // Call onSuccess callback
      onSuccess(userId);
      
      // Navigate to profile page
      navigate('/profile');
    } catch (error) {
      setErrors({
        submit: 'Failed to sign up'
      });
      console.error('Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    const emailError = validateEmail(newEmail);
    setErrors(prev => ({ ...prev, email: emailError || undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const passwordError = validatePassword(newPassword);
    setErrors(prev => ({ ...prev, password: passwordError || undefined }));
  };

  return (
    <div className="signup-container">
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
            type="email"
            value={email}
            onChange={handleEmailChange}
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
            onChange={handlePasswordChange}
            placeholder="Enter your password"
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>
        
        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}
        
        <button type="submit" disabled={isSubmitting} role="form">
          Create Account
        </button>
        
        <div className="login-link">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </form>
    </div>
  );
}