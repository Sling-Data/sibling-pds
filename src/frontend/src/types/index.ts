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
  token?: string; // Used by backend
  accessToken?: string; // Used internally
  refreshToken: string;
  userId?: string;
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
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  children: React.ReactNode;
}

// New component types
export interface TextInputProps {
  id: string;
  name: string;
  type?: "text" | "email" | "password" | "number";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

export interface CheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id: string;
  name: string;
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export interface CheckboxOption {
  value: string;
  label: string;
}

export interface CheckboxGroupProps {
  name: string;
  label?: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export interface StatusMessageProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onDismiss?: () => void;
  className?: string;
}

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ConnectServiceButtonProps {
  serviceName: string;
  serviceIcon?: React.ReactNode;
  onClick: () => void;
  isConnected?: boolean;
  isLoading?: boolean;
  className?: string;
}
