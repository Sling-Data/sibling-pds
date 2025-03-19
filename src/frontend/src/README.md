# Sibling PDS Frontend

## API Layer Refactoring

### Phase 1: Consolidated API Layer

We've refactored the API layer of the application to create a more consistent and powerful way to interact with the backend. Here's what we've accomplished:

#### 1. New `useApi` Hook
- Created a consolidated API hook that combines the best features of `useApiRequest` and `useFetch`
- Added support for:
  - Caching with automatic cache invalidation
  - Token refresh and authentication
  - Retry logic with exponential backoff
  - Better error handling
  - Query parameters
  - Loading, error, and success states
  - Notifications integration

```typescript
const { request, data, loading, error } = useApi<DataType>();

// Example usage:
const response = await request('/api/endpoint', {
  method: 'POST',
  body: data,
  requiresAuth: true,
  showSuccessNotification: true,
  successMessage: 'Data saved successfully!'
});
```

#### 2. Specialized Domain Hooks
- Created `useAuth` for authentication operations
  - Login, signup, logout
  - Token management
  - Authentication state
  - Route protection

```typescript
const { 
  isAuthenticated, 
  login, 
  signup, 
  logout, 
  refreshTokens, 
  checkAuth 
} = useAuth();

// Example usage:
await login({ email, password });
```

- Created `useUser` for user-related operations
  - User profile management
  - Onboarding status
  - Navigation based on auth state

```typescript
const {
  user,
  isLoading,
  error,
  fetchUserProfile,
  updateUserProfile,
  checkOnboardingStatus,
  checkUserDataAndNavigate
} = useUser();
```

- Created `useData` for data operations
  - CRUD operations for volunteered data
  - Data source management
  - Local state management

```typescript
const {
  volunteeredData,
  dataSources,
  fetchVolunteeredData,
  createVolunteeredData,
  fetchDataSources
} = useData();
```

#### 3. Updated Service Layer
- Refactored service classes to use the new API approach
- Aligned method names and parameters with the new hooks
- Improved error handling and type safety

#### 4. Documentation
- Updated the README with usage examples
- Added detailed API documentation
- Provided best practices for using the new hooks

### Benefits

1. **Improved Developer Experience**
   - Consistent API for making requests
   - Better TypeScript integration
   - More predictable error handling

2. **Reduced Duplication**
   - Consolidated overlapping functionality
   - Centralized authentication logic
   - Shared caching and retry logic

3. **Enhanced Maintainability**
   - Clear separation of concerns
   - More modular code
   - Better testability

4. **Better User Experience**
   - Retry on network errors
   - Automatic token refresh
   - Consistent loading states and error messages

### Next Steps

Phase 2: Form and Notification Improvements
- Enhance `useForm` with nested fields support
- Upgrade the notification system
- Add tests for the enhanced hooks 

## Phase 2: Form and Notification Improvements

- Enhanced the notification system integration with the API layer
- Connected notification display to API request results
- Improved error handling in forms
- Added detailed tests for notification behavior

## Phase 3: New Hooks Implementation

### Key Hook Implementations

#### `useAuth` Hook
The `useAuth` hook provides all authentication-related functionality:

```typescript
export function useAuth() {
  // State for tracking authentication status
  const [state, setState] = useState<AuthState>({
    isAuthenticated: !!getAccessToken(),
    isInitialized: false,
    userId: getUserId(),
  });

  // Login functionality
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> => {
      // Implementation details for login
    },
    [request]
  );

  // Signup functionality
  const signup = useCallback(
    async (credentials: SignupCredentials): Promise<ApiResponse<AuthTokens>> => {
      // Implementation details for signup
    },
    [request]
  );

  // Logout functionality
  const logout = useCallback(() => {
    // Implementation details for logout
  }, [addNotification, navigate]);

  // Token refresh functionality
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    // Implementation details for token refresh
  }, [request]);

  // Check authentication status
  const checkAuth = useCallback(
    (redirectPath: string = "/login"): boolean => {
      // Implementation details for checking auth
    },
    [navigate, addNotification]
  );

  return {
    ...state,
    login,
    signup,
    logout,
    refreshTokens,
    checkAuth,
  };
}
```

#### `useUser` Hook
The `useUser` hook manages user profile data and related operations:

```typescript
export function useUser() {
  // State for user data
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // API request hook
  const { request } = useApi();
  const navigate = useNavigate();

  // Fetch user profile
  const fetchUserProfile = useCallback(async (): Promise<ApiResponse<User>> => {
    // Implementation details for fetching user profile
  }, [request]);

  // Update user profile
  const updateUserProfile = useCallback(
    async (userData: Partial<User>): Promise<ApiResponse<User>> => {
      // Implementation details for updating user profile
    },
    [request]
  );

  // Check if user has completed onboarding
  const checkOnboardingStatus = useCallback(async (): Promise<boolean> => {
    // Implementation details for checking onboarding status
  }, [request]);

  // Navigate based on user data
  const checkUserDataAndNavigate = useCallback(() => {
    // Implementation details for navigation based on user data
  }, [navigate]);

  return {
    user,
    isLoading,
    error,
    fetchUserProfile,
    updateUserProfile,
    checkOnboardingStatus,
    checkUserDataAndNavigate,
  };
}
```

#### `useData` Hook
The `useData` hook provides access to data management functionality:

```typescript
export function useData() {
  // State for data
  const [volunteeredData, setVolunteeredData] = useState<VolunteeredData[]>([]);
  const [dataSources, setDataSources] = useState<UserDataSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // API request hook
  const { request } = useApi();

  // Fetch volunteered data
  const fetchVolunteeredData = useCallback(async (): Promise<ApiResponse<VolunteeredData[]>> => {
    // Implementation details for fetching volunteered data
  }, [request]);

  // Create volunteered data
  const createVolunteeredData = useCallback(
    async (data: Partial<VolunteeredData>): Promise<ApiResponse<VolunteeredData>> => {
      // Implementation details for creating volunteered data
    },
    [request]
  );

  // Fetch data sources
  const fetchDataSources = useCallback(async (): Promise<ApiResponse<UserDataSource[]>> => {
    // Implementation details for fetching data sources
  }, [request]);

  return {
    volunteeredData,
    dataSources,
    isLoading,
    error,
    fetchVolunteeredData,
    createVolunteeredData,
    fetchDataSources,
  };
}
```

## Phase 4: Component Updates (In Progress)

### Completed Component Updates

1. **ConnectGmail Component**
   - Fixed UX issue to keep the button visible when authentication popup is closed
   - Improved error messaging
   - Enhanced user feedback

2. **Profile Component**
   - Updated to use the `ConnectApi` molecule
   - Improved styling for Gmail and Plaid connection buttons
   - Enhanced error handling and user feedback

### Pending Component Updates

These components still need to be updated to use the new hooks architecture:

1. **LoginForm Component**
   - Replace direct API calls with useAuth.login
   - Improve error handling
   - Update tests

2. **SignupForm Component**
   - Replace useFetch with useAuth.signup
   - Improve form validation
   - Update tests

3. **DataInput Component**
   - Migrate to useData hook
   - Enhance loading states
   - Update tests

4. **App Component**
   - Ensure proper route protection with useAuth
   - Improve authentication flow
   - Update tests

## Detailed Component Migration Guide

### How to Migrate Components to New Hooks

1. **Analyze Current Implementation**
   - Review the current component implementation
   - Identify direct API calls or useFetch usage
   - Note state management and side effects

2. **Replace API Calls**
   - Replace direct fetch or useFetch calls with appropriate hook methods
   - Update state management to use hook states
   - Implement proper loading and error handling

3. **Update Tests**
   - Ensure tests mock the new hooks correctly
   - Update expectations to match new behavior
   - Verify all tests pass

### Example Migration: LoginForm

Before:
```typescript
// Using useFetch directly
const { data, error, loading, update } = useFetch();

const handleLogin = async (values) => {
  const result = await update('/auth/login', {
    method: 'POST',
    body: values
  });
  
  if (result.data) {
    // Handle successful login
  }
};
```

After:
```typescript
// Using useAuth hook
const { login, isAuthenticated } = useAuth();

const handleLogin = async (values) => {
  const response = await login(values);
  
  if (response.data) {
    // Handle successful login
  }
};
```

## Testing Strategy

### Key Testing Approaches

1. **Hook Testing**
   - Mock dependencies (fetch, TokenManager, contexts)
   - Test success and error paths
   - Verify state updates
   - Test side effects

2. **Component Testing**
   - Mock hooks to return predictable values
   - Test rendering with different states
   - Test user interactions
   - Verify correct hook method calls

### Mocking Hooks in Tests

Example of mocking useAuth in a test:
```typescript
// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    login: jest.fn().mockResolvedValue({
      data: { token: 'test-token', userId: 'user-123' },
      error: null
    }),
    logout: jest.fn(),
    checkAuth: jest.fn().mockReturnValue(false)
  })
}));
```

## Next Steps

1. Complete the remaining component updates
2. Implement consistent error handling
3. Replace all legacy fetch calls
4. Enhance the notification system
5. Prepare for cleanup of deprecated code

## Migration Checklist

- [ ] Update LoginForm to use useAuth
- [ ] Update SignupForm to use useAuth
- [ ] Update DataInput to use useData
- [ ] Update App to use useAuth for route protection
- [ ] Identify and update any additional components
- [ ] Verify all tests pass
- [ ] Create list of deprecated code for removal
- [ ] Update documentation 