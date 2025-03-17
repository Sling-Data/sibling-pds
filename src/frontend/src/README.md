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

#### 2. Specialized Domain Hooks
- Created `useAuth` for authentication operations
  - Login, signup, logout
  - Token management
  - Authentication state
  - Route protection

- Created `useUser` for user-related operations
  - User profile management
  - Onboarding status
  - Navigation based on auth state

- Created `useData` for data operations
  - CRUD operations for volunteered data
  - Data source management
  - Local state management

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