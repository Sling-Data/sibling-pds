// User-related types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  interests?: string[];
  primaryGoal?: string;
  location?: string;
  profession?: string;
  communicationStyle?: string;
  dailyAvailability?: string[];
  fitnessLevel?: string;
  learningStyle?: string[];
  age?: string;
  connectedServices?: {
    gmail?: boolean;
    plaid?: boolean;
  };
}

// Auth-related types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData extends AuthCredentials {
  name: string;
}

export interface AuthResponse {
  userId: string;
  token: string;
  refreshToken: string;
  message?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Form data types
export interface UserFormData {
  name: string;
  email: string;
}

export interface UserProfileFormData {
  interests: string[];
  primaryGoal: string;
  location: string;
  profession: string;
  communicationStyle: string;
  dailyAvailability: string[];
  fitnessLevel: string;
  learningStyle: string[];
  age: string;
}

// Service connection types
export interface ServiceConnectionResponse {
  url: string;
}

// API response types
export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
}

// Privacy settings
export interface PrivacySettings {
  dataSharing: boolean;
}
