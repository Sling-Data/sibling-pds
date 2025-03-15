/**
 * Common types for the Sibling PDS application
 */

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Authentication related types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

// API related types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Data related types
export interface VolunteeredData {
  id: string;
  userId: string;
  name: string;
  value: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BehavioralData {
  id: string;
  userId: string;
  name: string;
  value: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalData {
  id: string;
  userId: string;
  source: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserDataSource {
  id: string;
  userId: string;
  source: string;
  credentials: any;
  lastSynced?: string;
  createdAt: string;
  updatedAt: string;
}

// Component related types
export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: React.ReactNode;
} 